/* src/components/StudyRoom.tsx */

import { useState, useEffect } from 'react';
import ChapterFrame from './ChapterFrame';
import { FiBookOpen, FiClock } from 'react-icons/fi';
import { supabase } from '../lib/supabaseClient';
import AdminStudyRoom from './AdminStudyRoom';

interface RoomSchedule {
  study: string;
  talk: string;
}

const StudyRoom = () => {
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPeriod, setCurrentPeriod] = useState<number | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<Record<number, RoomSchedule> | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  const today = new Date();
  const displayDate = `${today.getMonth() + 1}月${today.getDate()}日`;

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

  useEffect(() => {
    // 1. スケジュール画像（全体像）を取得
    const fetchSignedUrl = async () => {
      setIsLoading(true);
      const today = new Date();
      const month = today.getMonth() + 1;
      const mday = today.getDate();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const weekOfMonth = Math.ceil((mday + firstDayOfMonth.getDay()) / 7) - 1;
      const imageName = `${month}.${weekOfMonth}.webp`;

      const { data, error } = await supabase.storage
        .from('images')
        .createSignedUrl(`studyroom/${imageName}`, 3600);

      if (error) {
        console.error('画像の取得に失敗しました:', error.message);
        setImagePath('/images/fallback-image.webp');
      } else if (data) {
        setImagePath(data.signedUrl);
      }
      setIsLoading(false);
    };

    // 2. DBから「今日のスケジュールデータ」を取得
    const fetchTodaySchedule = async () => {
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
      } else if (data && data.length > 0) {
        const formattedSchedule: Record<number, RoomSchedule> = {};
        data.forEach((row) => {
          formattedSchedule[row.period] = {
            study: row.study_rooms,
            talk: row.talk_rooms
          };
        });
        setTodaySchedule(formattedSchedule);
      }
    };

    fetchSignedUrl();
    fetchTodaySchedule();
    
    // ★ 3. 画面を開いた時の時間を1回だけセットする処理（自動更新なし）
    const initClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      
      setCurrentTimeStr(`${hours}:${minutes}`);
      setCurrentPeriod(calculateCurrentPeriod(now));
    };

    initClock();
    // 自動更新（setInterval）は削除しました
    
  }, []);

  const currentRooms = currentPeriod && todaySchedule ? todaySchedule[currentPeriod] : null;

  return (
    <ChapterFrame
      title={
        <div className="flex justify-center items-center gap-3 w-full">
          <FiBookOpen className="text-cyan-400 text-2xl sm:text-3xl" />
          <span className="font-orbitron font-bold text-cyan-300 text-glow text-xl sm:text-3xl">
            自習室・談話室
          </span>
        </div>
      }
    >
      <div className="flex flex-col items-center justify-center p-4">
        
        <div className="w-full max-w-2xl bg-slate-800/80 border-2 border-cyan-400/50 rounded-xl p-6 mb-6 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
          <div className="flex items-center justify-center gap-3 mb-4 text-cyan-300">
            <FiClock className="text-2xl" />
            <h3 className="text-xl font-bold tracking-wider">
              {displayDate} {currentTimeStr} 
              <span className="ml-2 text-cyan-100">
                {currentPeriod ? `(${currentPeriod}限)` : '(授業時間外)'}
              </span>
            </h3>
          </div>
          
          {currentRooms ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900 rounded-lg p-4 text-center border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">自習室</p>
                <p className="text-3xl font-bold text-white tracking-wider">{currentRooms.study}</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-4 text-center border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">談話室</p>
                <p className="text-3xl font-bold text-white tracking-wider">{currentRooms.talk}</p>
              </div>
            </div>
          ) : (
            <p className="text-center text-slate-300 py-4">
              {todaySchedule === null 
                ? "データを読み込み中..." 
                : "現在開放されている部屋はありません"}
            </p>
          )}
        </div>

        <div className="w-full max-w-2xl my-2 rounded-md flex justify-center items-center min-h-[150px]">
          {isLoading ? (
            <span className="text-slate-400 animate-pulse">スケジュール画像を読み込み中...</span>
          ) : (
            imagePath && (
              <img 
                src={imagePath} 
                alt="今週のスケジュール表"
                className="w-full h-auto rounded opacity-80"
                onError={(e) => {
                  e.currentTarget.src = '/images/fallback-image.webp';
                }}
              />
            )
          )}
        </div>

        <p className="text-slate-400 mt-4 text-sm text-center">
          ※閉館時間21:30（第1・3・5土曜は20:00）
        </p>
      </div>
      
      <AdminStudyRoom />
    </ChapterFrame>
  );
};

export default StudyRoom;