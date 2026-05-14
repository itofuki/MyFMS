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

      // 🌟 追加：ファイル名（例：「26年度_自習室案内.pdf」）から年度を抽出
      const yearMatch = file.name.match(/(\d{2})年度/);
      // 「26」が取れれば 2000 + 26 = 2026年。取れなければ今年の年をフォールバックとして使う
      const targetYear = yearMatch ? 2000 + parseInt(yearMatch[1], 10) : new Date().getFullYear();

      const pdfRes = await fetch(file.url_private_download, { headers: { Authorization: `Bearer ${slackUserToken}` } });
      const pdfUint8Array = new Uint8Array(await pdfRes.arrayBuffer());

      console.log("🧠 gemini-3.1-pro-preview による解析を開始します...");
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      
      // gemini-3.1-pro-preview
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3.1-pro-preview",
        generationConfig: { 
          responseMimeType: "application/json",
          temperature: 0
        }
      });
      
      const pdfBase64 = encode(pdfUint8Array);

      const prompt = `あなたは視覚的ドキュメント解析の専門家です。提供されたPDF（自習室開放時間割）を以下の【思考プロセス】に従って厳密に解析し、JSONデータを作成してください。

      【★最重要：錯覚防止と超短縮・言語化プロセス】
      AIは「空白」と「文字の始まり」の境界に、存在しない「縦の罫線」を幻覚する致命的な弱点があります。
      これを防ぐため、JSONの最初のキー \`grid_analysis\` で、実際に引かれている「黒い実線」の位置を超短縮記号でメモしてください。※出力時間を削るため、基本レイアウトから外れた「例外的な日」のみを抽出し、それ以外は記述しないでください。

      【思考プロセス：物理的グリッドと対称性のスキャン】
      1. **メタデータの抽出**:
        - PDF全体から「開始日 (start_date)」と「終了日 (end_date)」を特定してください。
        - **必ず「${targetYear}年」として処理してください。**（例: 日付が 4/24 なら ${targetYear}-04-24）。

      2. **縦線の厳密なスキャン（★「点線トラップ」の排除）**:
        - **【重大な警告】「談話室」と「自習室」を隔てる横線は「点線（......）」です。**
        - このため、下の自習室にある「黒い実線の縦線」が、弱い点線を突き抜けて上の談話室まで続いていると錯覚（視覚の貫通モレ）を起こしやすくなっています。
        - 縦線を探すときは、その行の空間に「明確な黒い実線」が存在するかだけを見てください。自習室の縦線は点線で確実に止まっており、談話室には絶対に影響しません。

      3. **【絶対法則】重心と対称性による結合の推論**:
        - 表計算ソフトの仕様上、結合されたセル内の文字は**「中央（重心）」**に配置されます。
        - **例**: 縦線がない3限〜6限の広いブロックにおいて、文字が「4限と5限の間」に配置されている場合、それは右に寄っているのではなく「ブロック全体の中央」に配置されているだけです。
        - したがって、文字がない「3限」や「6限」を勝手に空白（-）として切り捨てるなど、**非対称な解釈（例：3限だけハイフンで、4〜6限に部屋を割り当てる等）は絶対にやめてください。** 必ずブロック全体（3,4,5,6限すべて）に同じ文字列を適用してください。

      4. **空白と記号のルール（★NULL禁止）**:
        - **JSONの値に null を使用することは絶対厳禁です。**
        - ブロック内に本当に文字がない場合や「-」「ー」のみの場合は、文字列の "-" を出力してください。
        - 「・」などの記号も正確に抽出してください。

      【出力JSONフォーマット（★高速化・配列仕様）】
      出力文字数を極限まで減らすため、1日につき1つのオブジェクトとし、各部屋の1限〜6限の値を**配列（長さ6）**で出力してください。値には null を絶対に含めないこと。
      {
        "grid_analysis": "例外的な日のみを超短縮記号でメモ（例：「5/14談: 線[2|3, 5|6] 結合[1-2, 3-5, 6]」）。隣の行の線に騙されていないか必ず確認すること。",
        "start_date": "YYYY-MM-DD",
        "end_date": "YYYY-MM-DD",
        "schedules": [
          { 
            "target_date": "YYYY-MM-DD", 
            "talk_rooms": ["1限の値", "2限の値", "3限の値", "4限の値", "5限の値", "6限〜の値"], 
            "study_rooms": ["1限の値", "2限の値", "3限の値", "4限の値", "5限の値", "6限〜の値"] 
          }
        ]
      }
      `;

      // 処理を呼び出す際、作成したリトライ関数を使用する
      const result = await generateContentWithRetry(model, [
        { inlineData: { data: pdfBase64, mimeType: "application/pdf" } },
        prompt
      ]);
      
      const parsed = JSON.parse(result.response.text());

      console.log("🧠 AIの自己分析結果 (grid_analysis):", parsed.grid_analysis);

      // AIが日付の読み取りに失敗した時の「安全装置」を追加
      if (!parsed.start_date || !parsed.end_date) {
        throw new Error(`AIが期間(start_date/end_date)の読み取りに失敗しました。AIの回答: ${JSON.stringify(parsed)}`);
      }
      
      const fileName = `timetable_${parsed.start_date}_${parsed.end_date}.pdf`;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // 1. Storageへのアップロード（エラーチェック追加）
      const { error: uploadError } = await supabase.storage.from('images').upload(`studyroom/${fileName}`, pdfUint8Array, { 
        upsert: true,
        contentType: 'application/pdf'
      });
      if (uploadError) {
        throw new Error(`ストレージ保存エラー: ${uploadError.message}`);
      }

      // 2. schedule_metadata への保存（エラーチェック追加）
      const { error: metaError } = await supabase.from('schedule_metadata').upsert({
        filename: fileName,
        start_date: parsed.start_date,
        end_date: parsed.end_date
      }, { onConflict: 'filename' });
      if (metaError) {
        throw new Error(`メタデータ保存エラー: ${metaError.message}`);
      }

      // 3. room_schedules への保存
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