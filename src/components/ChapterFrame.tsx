import React from 'react';
import type { IconType } from 'react-icons';

interface ChapterFrameProps {
  title: React.ReactNode;
  icon?: IconType;
  children: React.ReactNode;
}

const ChapterFrame: React.FC<ChapterFrameProps> = ({ title, icon: Icon, children }) => {
  return (
    // 🌟 外側のコンテナ
    // ライト時: 白ベース(bg-white/80), グレーの境界(border-slate-200)
    // ダーク時: これまで通りの深い色(dark:bg-slate-900/70)
    <div className="flex flex-col bg-slate-900/70 backdrop-blur-lg border border-white/10 shadow-xl rounded-lg w-full overflow-hidden">
      
      {/* ヘッダー部分 */}
      <div className="flex items-center h-16 px-4 sm:px-6 border-b border-slate-700">
        <div className="flex items-center gap-3 w-full">
          
          {Icon && <Icon className="text-cyan-400 text-2xl sm:text-3xl flex-shrink-0" />}
          
          <h1 className="font-orbitron font-bold text-cyan-300 text-glow w-full relative">
            {title}
          </h1>

        </div>
      </div>

      {/* コンテンツ部分（背景が黒いエリア） */}
      <div className="flex flex-col items-center p-4 sm:p-6 bg-slate-950">
        {children}
      </div>
    </div>
  );
};

export default ChapterFrame;