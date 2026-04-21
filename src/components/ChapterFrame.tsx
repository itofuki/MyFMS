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
    <div className="flex flex-col bg-white/80 dark:bg-slate-900/70 backdrop-blur-lg border border-slate-200 dark:border-white/10 shadow-xl rounded-lg w-full overflow-hidden transition-colors duration-300">
      
      {/* ヘッダー部分 */}
      {/* 🌟 境界線の色を両対応に(border-slate-200 / dark:border-slate-700) */}
      <div className="flex items-center h-16 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-700 transition-colors duration-300">
        <div className="flex items-center gap-3 w-full">
          
          {/* 🌟 アイコンの色を調整 (ライト時は少し濃いめの青緑 text-cyan-600) */}
          {Icon && (
            <Icon className="text-cyan-600 dark:text-cyan-400 text-2xl sm:text-3xl flex-shrink-0 transition-colors duration-300" />
          )}
          
          {/* 🌟 タイトル文字 */}
          {/* ライト時: 濃いめのシアン(text-cyan-700) / ダーク時: 輝くシアン(dark:text-cyan-300 dark:text-glow) */}
          <h1 className="font-orbitron font-bold text-cyan-700 dark:text-cyan-300 dark:text-glow w-full relative transition-colors duration-300">
            {title}
          </h1>

        </div>
      </div>

      {/* コンテンツ部分 */}
      {/* 🌟 ライト時はごく薄いグレー(bg-slate-50) / ダーク時は真っ黒に近い色(dark:bg-slate-950) */}
      <div className="flex flex-col items-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="w-full text-slate-800 dark:text-slate-200">
          {children}
        </div>
      </div>

    </div>
  );
};

export default ChapterFrame;