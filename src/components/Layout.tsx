import { useState } from 'react';
import { Outlet, Link } from "react-router-dom";
import { Toaster } from 'sonner';
import { useSidebar, type ChapterLink } from "../contexts/SidebarContext";
import { FiMenu, FiSettings } from "react-icons/fi";

// ▼▼▼ メニューの中身（PC・スマホ共通）を切り出しました ▼▼▼
const SidebarContent: React.FC<{
  links: ChapterLink[];
  activeId: string;
  onNavigate: (id: string) => void;
  closeMenu: () => void;
}> = ({ links, activeId, onNavigate, closeMenu }) => {

  const handleNavigate = (id: string) => {
    onNavigate(id);
    closeMenu(); // リンククリックでメニューを閉じる
  };

  return (
    <div className="flex flex-col justify-between h-full">
      <div className="pt-8 md:pt-18">
        <h2 className="text-lg font-bold text-white mb-6 px-2">メニュー</h2>
        <ul className="space-y-2">
          {links.map(link => (
            <li key={link.id}>
              <button
                onClick={() => handleNavigate(link.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors duration-200 text-sm font-medium ${
                  activeId === link.id
                    ? 'bg-cyan-500 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-slate-700/80'
                }`}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="pb-4">
        <Link 
          to="/setting" 
          onClick={closeMenu}
          className="flex items-center gap-3 p-3 rounded-lg text-slate-400 hover:bg-slate-700/80 hover:text-cyan-400 transition-colors duration-200"
        >
          <FiSettings size={20} className="glowing-gear" />
          <span className="font-medium text-sm">設定</span>
        </Link>
      </div>
    </div>
  );
};


// ▼▼▼ 全体のレイアウトコンポーネント ▼▼▼
export default function Layout() {
  const { isMobileMenuOpen, setIsMobileMenuOpen, chapterLinks, activeChapter, setActiveChapter } = useSidebar();

  // =================================================================
  // スワイプ検知用のStateと関数（Layoutで一括管理）
  // =================================================================
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;
  const edgeThreshold = 30; // 誤爆防止: 画面左端から30px以内のスワイプのみ「開く」反応をする

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    const clientX = e.targetTouches[0].clientX;
    
    // メニューが閉じている時は、画面の左端からのスワイプのみ許可
    if (!isMobileMenuOpen && clientX > edgeThreshold) return;
    
    setTouchStart(clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;
    const distance = touchEnd - touchStart;

    if (!isMobileMenuOpen && distance > minSwipeDistance) {
      setIsMobileMenuOpen(true); // 右へスワイプで開く
    }
    if (isMobileMenuOpen && distance < -minSwipeDistance) {
      setIsMobileMenuOpen(false); // 左へスワイプで閉じる
    }
  };
  // =================================================================

  return (
    // 画面全体を覆い、はみ出た部分を隠す大枠
    <div 
      className="min-h-screen bg-slate-900 text-slate-300 overflow-hidden relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ① スマホ用メニュー（最下層に固定配置） */}
      {/* メイン画面が右にスライドすると、この下敷きになっていたメニューが見える仕組みです */}
      {chapterLinks.length > 0 && (
        <div className="md:hidden fixed inset-y-0 left-0 w-64 bg-slate-900 z-0 p-4 border-r border-white/10">
          <SidebarContent
            links={chapterLinks}
            activeId={activeChapter}
            onNavigate={setActiveChapter}
            closeMenu={() => setIsMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* ② メイン画面のラッパー（★ここが横にスライドします） */}
      <div 
        className={`relative z-10 flex flex-col h-screen bg-slate-900 transition-transform duration-300 ease-out ${
          isMobileMenuOpen 
            ? 'translate-x-64 md:translate-x-0 shadow-[-15px_0_30px_rgba(0,0,0,0.6)]' // 開いた時は右にズレて影を落とす
            : 'translate-x-0'
        }`}
      >
        {/* スマホでメニューが開いている時のオーバーレイ（タップで閉じる用） */}
        {isMobileMenuOpen && (
          <div 
            className="md:hidden absolute inset-0 bg-black/40 z-50 backdrop-blur-[1px]"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ナビゲーションバー */}
        <nav className="absolute top-0 left-0 w-full z-20 bg-slate-800/70 backdrop-blur-lg border-b border-white/10">
          <div className="flex items-center justify-between h-15 md:h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              {chapterLinks.length > 0 && (
                <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-slate-300" aria-label="メニューを開く">
                  <FiMenu size={24} />
                </button>
              )}
              <Link to="/" className="text-2xl item-center font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-500 to-purple-500 hover:opacity-90 transition-opacity">
                MyFMS
              </Link>
            </div>
          </div>
        </nav>

        {/* コンテンツエリア（PCサイドバー ＋ ページ本体） */}
        <div className="flex flex-1 overflow-hidden h-full">
          
          {/* PC用サイドバー（画面幅md以上で表示） */}
          {chapterLinks.length > 0 && (
            <aside className="hidden md:flex w-48 flex-shrink-0 bg-slate-900/60 border-r border-white/10 p-4 pt-16 flex-col justify-between z-10">
              <SidebarContent
                links={chapterLinks}
                activeId={activeChapter}
                onNavigate={setActiveChapter}
                closeMenu={() => {}} // PCでは閉じない
              />
            </aside>
          )}

          {/* 実際のページ（MyPageなど）が表示される領域 */}
          <main className="flex-1 overflow-y-auto relative z-10">
            <Outlet />
          </main>
        </div>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}