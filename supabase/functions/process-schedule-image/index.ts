import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { encodeBase64 } from "https://deno.land/std@0.208.0/encoding/base64.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) throw new Error("GeminiのAPIキーが設定されていません")

    const { imageUrl, year } = await req.json()

    // 1. 画像データの取得と準備（★ここで mimeType を定義しています）
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64Image = encodeBase64(arrayBuffer);
    const mimeType = imageBlob.type || 'image/webp';

    // 2. Gemini APIの呼び出し（賢いProモデルを指定）
    // 無料枠が最も安定している標準モデルに変更
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    
    // 強化版プロンプト
    const prompt = `あなたは視覚的な表読み取りの専門家です。画像の時間割表から、日付と時限（1〜6）ごとの「自習室」と「談話室」の割り当てを読み取り、JSONフォーマットで出力してください。

    【絶対に守るべきルール】
    1. 年は ${year} 年とし、日付は YYYY-MM-DD 形式にしてください。
    2. 時限は「1限」「2限」「3限」「4限」「5限」「6限」の6区分です。必ず1日につき6行（6時限分）のデータを出力してください。
    3. ★重要★ セルが横に結合されている（間の縦線がない）場合は、またがっている「すべて」の時限に対して、全く同じ部屋番号を埋めてください。
    4. 「ー」（ハイフン）が書かれている、または空欄になっている部分は "ー" と出力してください。
    5. 複数の部屋番号（例：361・374）や、「30MR」のような英数字も、画像に書かれている通りに一言一句正確に抽出してください。

    フォーマット例: 
    {
      "schedules": [
        { "target_date": "2026-04-13", "period": 1, "talk_rooms": "353", "study_rooms": "361・374" },
        { "target_date": "2026-04-13", "period": 2, "talk_rooms": "353", "study_rooms": "361・374" }
      ]
    }`;

    const geminiResponse = await fetch(geminiApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64Image } }
          ]
        }],
        // 必ずJSONで返すように指示
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const aiData = await geminiResponse.json();
    if (aiData.error) throw new Error(aiData.error.message);

    // AIの返答からJSONを抽出
    const textResult = aiData.candidates[0].content.parts[0].text;
    const resultJson = JSON.parse(textResult);
    const schedules = resultJson.schedules;

    // 3. Supabaseのデータベースに保存
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data, error } = await supabaseClient
      .from('room_schedules')
      .upsert(schedules, { onConflict: 'target_date, period' })
      .select()

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})