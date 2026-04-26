import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import ical from "https://esm.sh/node-ical@0.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const calendarUrl = Deno.env.get('LMS_CALENDAR_URL');
    if (!calendarUrl) throw new Error("カレンダーのURLが設定されていません");

    const response = await fetch(calendarUrl);
    const icsData = await response.text();
    const events = await ical.async.parseICS(icsData);
    
    const formattedEvents = Object.values(events)
      .filter((event: any) => event.type === 'VEVENT')
      .map((event: any) => {
        
        let descStr = '';
        if (event.description) {
          descStr = typeof event.description === 'string' 
            ? event.description 
            : (event.description.val || '');
        }

        // 科目コード(categoryCode)を抽出
        let categoryCodeStr = '';
        if (event.categories && Array.isArray(event.categories) && event.categories.length > 0) {
          categoryCodeStr = typeof event.categories[0] === 'string' 
            ? event.categories[0] 
            : (event.categories[0].val || '');
        }

        return {
          uid: event.uid,
          summary: event.summary || '無題の予定',
          description: descStr,
          start: event.start,
          end: event.end,
          categoryCode: categoryCodeStr, // 🌟 これがフロントに渡される
        };
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return new Response(JSON.stringify({ events: formattedEvents }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});