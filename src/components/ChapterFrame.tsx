import React from 'react';
import type { IconType } from 'react-icons';

// このコンポーネントが受け取るpropsの型を定義
interface ChapterFrameProps {
  title: React.ReactNode;
  icon?: IconType; // アイコンは任意 (あってもなくても良い)
  children: React.ReactNode; // 中に表示するコンテンツ
}

const ChapterFrame: React.FC<ChapterFrameProps> = ({ title, icon: Icon, children }) => {
  return (
    // 外側の半透明コンテナ
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