/* src/components/StudyRoom.tsx */

import { useState, useEffect } from 'react';
import ChapterFrame from './ChapterFrame'; // ChapterFrameをインポート
import { FiBookOpen } from 'react-icons/fi';
import { supabase } from '../lib/supabaseClient';

const StudyRoom = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const mday = today.getDate();

  const firstDayOfMonth = new Date(year, month, 1);
  const firstDayOfWeek = firstDayOfMonth.getDay();

  const weekOfMonth = Math.ceil((mday + firstDayOfWeek) / 7) - 1;
  const imageName = `${month + 1}.${weekOfMonth}.webp`;
  
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSignedUrl = async () => {
      setIsLoading(true);
      
      // ★ Supabase Storageから署名付きURLを取得
      // 'images' の部分は実際のバケット名に変更してください
      // 第2引数は有効期限（秒）です。ここでは3600秒（1時間）としています
      const { data, error } = await supabase.storage
        .from('images')
        .createSignedUrl(`studyroom/${imageName}`, 3600);

      if (error) {
        console.error('画像の取得に失敗しました:', error.message);
        // エラー時のフォールバック画像のパスを指定（任意）
        setImagePath('/images/fallback-image.png');
      } else if (data) {
        setImagePath(data.signedUrl);
      }
      
      setIsLoading(false);
    };

    fetchSignedUrl();
  }, [imageName]);

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
      <div className="min-h-[200px] flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl my-2 md:my-5 rounded-md flex justify-center items-center min-h-[150px]">
          {isLoading ? (
            // 読み込み中の表示（ローディングスピナーやスケルトンなどに置き換えてもOKです）
            <span className="text-slate-400 animate-pulse">画像を読み込み中...</span>
          ) : (
            imagePath && (
              <img 
                src={imagePath} 
                alt={`自習室 ${month + 1}月 第${weekOfMonth + 1}週`}
                className="w-full h-auto rounded"
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
    </ChapterFrame>
  );
};

export default StudyRoom;