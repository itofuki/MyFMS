/* supabase/functions/slack-schedule-receiver/index.ts */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { encode } from "https://deno.land/std@0.200.0/encoding/base64.ts";

const slackUserToken = Deno.env.get("SLACK_USER_TOKEN")!;
const geminiApiKey = Deno.env.get("GEMINI_API_KEY")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// 実行環境の強制終了を避けるため、1回の待機を短くして回数で粘る
async function generateContentWithRetry(model: any, requestData: any, maxRetries = 8) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await model.generateContent(requestData);
    } catch (error: any) {
      const isRetryable = error.status === 503 || error.status === 429;

      if (isRetryable && i < maxRetries - 1) {
        // ベースの待機時間を抑えめにする (3秒, 6秒, 12秒...)
        const exponentialWait = Math.pow(2, i) * 3000; 
        
        // ★重要★ どんなに長くても1回の待機を「30秒」で打ち切る
        const delayCap = 30000; 
        
        // 0〜5秒のランダムなゆらぎ
        const jitter = Math.floor(Math.random() * 5000); 
        
        const waitTime = Math.min(exponentialWait, delayCap) + jitter;

        console.log(`⚠️ サーバー混雑中(${error.status}): ${(waitTime / 1000).toFixed(1)}秒待機して再試行します... (試行 ${i + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      throw error;
    }
  }
}

serve(async (req) => {
  try {
    if (req.method === "GET") return new Response("API is running!", { status: 200 });

    const retryNum = req.headers.get("x-slack-retry-num");
    if (retryNum) return new Response("OK", { status: 200 });

    const bodyText = await req.text();
    const body = JSON.parse(bodyText);

    if (body.type === "url_verification") return new Response(body.challenge, { status: 200 });

    if (body.event && body.event.type === "message" && body.event.text) {
      const text = body.event.text;
      const match = text.match(/\/archives\/(C[A-Z0-9]+)\/p(\d+)/);
      if (!match) return new Response("No link", { status: 200 });

      const origChannel = match[1];
      const origTsStr = match[2];
      const origTs = origTsStr.slice(0, -6) + '.' + origTsStr.slice(-6);

      const historyRes = await fetch(`https://slack.com/api/conversations.history?channel=${origChannel}&latest=${origTs}&limit=1&inclusive=true`, {
        headers: { Authorization: `Bearer ${slackUserToken}` }
      });
      const historyData = await historyRes.json();
      const originalMessage = historyData.messages?.[0];

      if (!originalMessage?.files?.[0]) return new Response("No files", { status: 200 });
      const file = originalMessage.files[0];
      if (file.filetype !== "pdf" || !file.name?.includes("自習室")) return new Response("Skip", { status: 200 });

      const pdfRes = await fetch(file.url_private_download, { headers: { Authorization: `Bearer ${slackUserToken}` } });
      const pdfUint8Array = new Uint8Array(await pdfRes.arrayBuffer());

      console.log("🧠 gemini-3-flash-preview による解析を開始します...");
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      
      // gemini-3.1-pro-preview
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3-flash-preview",
        generationConfig: { responseMimeType: "application/json" }
      });
      
      const pdfBase64 = encode(pdfUint8Array);

      const prompt = `あなたは視覚的な表読み取りの専門家です。学校の自習室の開放時間割（PDF）から情報を読み取り、JSONフォーマットで出力してください。

      精度を最大化するために、必ず以下の【Step 1】で表を仮想的に切り取り、【Step 2】で中身を分析し、最後にデータを出力するという段階的なプロセス（思考プロセス）を踏んでください。

      【Step 1: 仮想的な表の切り取り（ノイズの排除）】
      PDF全体にはヘッダー、フッター、注意書きなどがありますが、それらは一切無視してください。あなたの視界を「表の内部のみ」に限定します。
      - 上端: 日付や曜日が書かれているヘッダー行を囲む、一番上の横線（外枠）
      - 下端: 表全体の一番下の横線（外枠）
      - 左右: 表の外枠の境界線（外枠）
      この範囲外にある情報は、今後のデータ抽出において完全に存在しないものとして扱ってください。

      【Step 2: セルの厳密な読み取りルール】
      仮想的に切り取った表の中身を、以下の絶対ルールに従って左上から右下へ順番に読み取ります。
      1. 日付は YYYY-MM-DD 形式に変換（例: 5月7日 -> 2026-05-07）。
      2. 1日につき必ず1限〜6限の6行分のデータを作成する。
      3. ★結合セルの処理★ 縦や横に大きく結合されている（間に区切り線がない）セルは、またがっている【すべて】の時限に全く同じ部屋番号を入れる。
      4. ★「文字がない空間」の正しい解釈★ この表に「単なる空欄」という概念は絶対に存在しません。指定の教室がない時限には、必ず明確に「-」（ハイフン）が記載されています。したがって、もし【文字が何も書かれていない空白の場所】があった場合、それは空欄ではなく「結合されたセルの一部」です。勝手に「-」で埋めることは絶対にやめ、必ず【左右のセルを探索】し、その領域全体にまたがっている教室名を見つけ出して正確に抽出してください。
      5. 部屋番号（例：361・374、30MR）は一言一句正確に抽出する。

      【JSONの出力形式】
      いきなりデータを書かず、必ず以下のキーの順番通りに出力してください。
      {
        "step1_virtual_crop": "表の上端・下端・左右の範囲を特定し、余計な注意書きを無視したことを宣言してください。",
        "step2_cell_analysis": "結合セルや、文字がない空間（ハイフンとの違い）をどのように処理したかを説明してください。",
        "start_date": "2026-05-07",
        "end_date": "2026-05-16",
        "schedules": [
          { "target_date": "2026-05-07", "period": 1, "talk_rooms": "-", "study_rooms": "361・374" },
          { "target_date": "2026-05-07", "period": 2, "talk_rooms": "-", "study_rooms": "361・374" }
        ]
      }`;

      // 処理を呼び出す際、作成したリトライ関数を使用する
      const result = await generateContentWithRetry(model, [
        { inlineData: { data: pdfBase64, mimeType: "application/pdf" } },
        prompt
      ]);
      
      const parsed = JSON.parse(result.response.text());

      const fileName = `timetable_${parsed.start_date}_${parsed.end_date}.pdf`;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // 🌟 1. Storageへのアップロード（エラーチェック追加）
      const { error: uploadError } = await supabase.storage.from('images').upload(`studyroom/${fileName}`, pdfUint8Array, { 
        upsert: true,
        contentType: 'application/pdf'
      });
      if (uploadError) {
        throw new Error(`ストレージ保存エラー: ${uploadError.message}`);
      }

      // 🌟 2. schedule_metadata への保存（エラーチェック追加）
      const { error: metaError } = await supabase.from('schedule_metadata').upsert({
        filename: fileName,
        start_date: parsed.start_date,
        end_date: parsed.end_date
      }, { onConflict: 'filename' });
      if (metaError) {
        throw new Error(`メタデータ保存エラー: ${metaError.message}`);
      }

      // 🌟 3. room_schedules への保存（既存のまま）
      const { error: dbError } = await supabase.from('room_schedules').upsert(parsed.schedules, { 
        onConflict: 'target_date, period' 
      });
      if (dbError) {
        throw new Error(`スケジュール保存エラー: ${dbError.message}`);
      }

      console.log(`✅ 完了！ ${fileName} の情報を解析し、${parsed.schedules.length}件のスケジュールを保存しました。`);
      return new Response("Success", { status: 200 });
    }
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("🚨 エラー:", error);
    return new Response("Error", { status: 500 });
  }
});