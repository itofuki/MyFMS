/* src/components/StudyRoom.tsx */

import { useState, useEffect } from 'react';
import ChapterFrame from './ChapterFrame';
import { FiBookOpen } from 'react-icons/fi';
import { supabase } from '../lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';

interface RoomSchedule {
  study: string;
  talk: string;
}

const StudyRoom = () => {
  // ★ 時間割(Timetable)と同じく、1分ごとに更新される時間ステート
  const [currentTime, setCurrentTime] = useState(() => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" })));

  // 1分ごとに時間を更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" })));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const calculateCurrentPeriod = (now: Date) => {
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const time = hours * 100 + minutes;

    if (time >= 800 && time < 1050) return 1;
    if (time >= 1050 && time < 1225) return 2;
    if (time >= 1225 && time < 1450) return 3;
    if (time >= 1450 && time < 1630) return 4;
    if (time >= 1630 && time < 1810) return 5;
    if (time >= 1810) return 6;
    return null;
  };

  const currentPeriod = calculateCurrentPeriod(currentTime);

  // 🌟 React Query: スケジュールPDFの取得（完璧な最終版）
  const { data: pdfPath, isLoading: isLoadingPdf } = useQuery({
    queryKey: ['studyRoomPdf', new Date().toLocaleDateString('sv-SE')],
    queryFn: async () => {
      // 今日の日付を取得 (YYYY-MM-DD形式)
      const today = new Date().toLocaleDateString('sv-SE'); 

      // 1. DBから「今日表示すべきファイル名」を取得
      const { data: meta, error: metaError } = await supabase
        .from('schedule_metadata')
        .select('filename')
        .lte('start_date', today)
        .gte('end_date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (metaError) {
        console.error('メタデータの取得に失敗しました:', metaError.message);
        return null;
      }

      if (!meta) {
        return null; // 今日該当する時間割がない場合
      }

      // 2. 🌟 純粋な公開URLを取得（ブラウザのPDFビューアを正しく起動させるため）
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(`studyroom/${meta.filename}`);

      // 余計なパラメータ（?t=...）をつけず、純粋なURLを返す
      return data.publicUrl;
    },
    staleTime: 1000 * 60 * 55, 
  });

  // 🌟 React Query: DBからの「今日のスケジュールデータ」を取得
  const { data: todaySchedule, isLoading: isLoadingSchedule } = useQuery({
    // 日付が変わったらキャッシュを無効化して再フェッチされるように、Query Keyに日付を含める
    queryKey: ['todaySchedule', new Date().toLocaleDateString('ja-JP')], 
    queryFn: async () => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayFormatted = `${yyyy}-${mm}-${dd}`;

      const { data, error } = await supabase
        .from('room_schedules')
        .select('period, study_rooms, talk_rooms')
        .eq('target_date', todayFormatted);

      if (error) {
        console.error('DBからのスケジュール取得に失敗しました:', error.message);
        return {}; 
      }

      const formattedSchedule: Record<number, RoomSchedule> = {};
      data.forEach((row) => {
        formattedSchedule[row.period] = {
          study: row.study_rooms,
          talk: row.talk_rooms
        };
      });
      return formattedSchedule;
    },
    staleTime: 1000 * 60 * 60, // 1時間キャッシュ
  });

  const currentRooms = currentPeriod && todaySchedule ? todaySchedule[currentPeriod] : null;

  // ★ 時間割画面と同じ表示用の変数を準備
  const month = currentTime.getMonth() + 1;
  const mday = currentTime.getDate();
  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];
  const wday = weekDays[currentTime.getDay()];
  const hours = String(currentTime.getHours()).padStart(2, '0');
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');

  return (
    <ChapterFrame
      title={
        <div className="flex justify-center items-center gap-3 w-full">
          <FiBookOpen className="text-cyan-400 text-2xl sm:text-3xl" />
          <span className="font-orbitron font-bold text-cyan-300 text-glow text-xl sm:text-3xl">
            自習室
          </span>
        </div>
      }
    >
      <div className="flex flex-col items-center justify-center p-2">
        
        <div className="w-full max-w-2xl min-w-[340px] md:min-w-[600px] bg-slate-800/80 border-2 border-cyan-400/50 rounded-xl p-4 md:p-6 mb-6 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
          <div className="flex items-center justify-center mb-6 text-cyan-300">
            <h3 className="font-bold text-glow">
              <span className="flex items-baseline justify-center">
                <span className="text-2xl md:text-4xl">{month}</span>
                <span className="text-base md:text-lg mx-0.5 md:mx-1">/</span>
                <span className="text-2xl md:text-4xl">{mday}</span>
                <span className="text-base md:text-xl ml-1">({wday})</span>
                <span className="ml-2 md:ml-4 flex items-baseline">
                  <span className="text-2xl md:text-4xl">{hours}</span>
                  <span className="text-base md:text-lg mx-0.5 md:mx-1">:</span>
                  <span className="text-2xl md:text-4xl">{minutes}</span>
                </span>
                <span className="text-base md:text-xl ml-2 text-cyan-100">
                  {currentPeriod ? `(${currentPeriod}限)` : '(授業時間外)'}
                </span>
              </span>
            </h3>
          </div>
          
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            
            {/* --- 自習室 --- */}
            <div className="bg-slate-900 rounded-lg p-3 md:p-4 text-center border border-slate-700 flex flex-col justify-center min-h-[84px] md:min-h-[108px]">
              <p className="text-slate-400 text-xs md:text-sm mb-1">自習室</p>
              <div className="flex-1 flex items-center justify-center">
                {isLoadingSchedule ? (
                  <span className="text-slate-500 text-xs md:text-sm animate-pulse">読み込み中...</span>
                ) : currentRooms ? (
                  <span className="text-lg md:text-3xl font-bold text-white tracking-wider">{currentRooms.study}</span>
                ) : (
                  <span className="text-slate-500 text-sm">-</span>
                )}
              </div>
            </div>

            {/* --- 談話室 --- */}
            <div className="bg-slate-900 rounded-lg p-3 md:p-4 text-center border border-slate-700 flex flex-col justify-center min-h-[84px] md:min-h-[108px]">
              <p className="text-slate-400 text-xs md:text-sm mb-1">談話室</p>
              <div className="flex-1 flex items-center justify-center">
                {isLoadingSchedule ? (
                  <span className="text-slate-500 text-xs md:text-sm animate-pulse">読み込み中...</span>
                ) : currentRooms ? (
                  <span className="text-lg md:text-3xl font-bold text-white tracking-wider">{currentRooms.talk}</span>
                ) : (
                  <span className="text-slate-500 text-sm">-</span>
                )}
              </div>
            </div>

          </div>

          {/* 授業時間外などで部屋が開放されていない場合のメッセージ */}
          {todaySchedule !== undefined && !currentRooms && !isLoadingSchedule && (
            <p className="text-center text-slate-400 mt-4 text-sm md:text-base">
              現在開放されている部屋はありません
            </p>
          )}
        </div>

        <div className="w-full max-w-2xl my-2 rounded-md flex justify-center items-center min-h-[150px]">
          {isLoadingPdf ? (
            <span className="text-slate-400 animate-pulse">スケジュール表を読み込み中...</span>
          ) : (
            pdfPath ? (
              <object 
                data={pdfPath} 
                type="application/pdf" 
                className="w-full h-[475px] md:h-[950px] rounded opacity-80 bg-white"
              >
                <div className="flex flex-col items-center justify-center p-4 bg-slate-800 rounded">
                  <p className="text-slate-300 mb-2">ブラウザでPDFを表示できません。</p>
                  <a 
                    href={pdfPath} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-cyan-400 underline hover:text-cyan-300"
                  >
                    こちらからダウンロードして確認してください
                  </a>
                </div>
              </object>
            ) : (
              <span className="text-slate-500">今週のスケジュールはまだありません</span>
            )
          )}
        </div>
      </div>

    </ChapterFrame>
  );
};

export default StudyRoom;