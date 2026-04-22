/* src/Layout.tsx */
import { useRef, useEffect } from 'react';
import { Outlet, Link } from "react-router-dom";
import { Toaster } from 'sonner';
import { useSidebar, type ChapterLink } from "../contexts/SidebarContext"; 
import { FiMenu, FiSettings, FiCalendar, FiFileText, FiBookOpen, FiFolder } from "react-icons/fi";

const getChapterIcon = (id: string, size: number = 20) => {
  switch (id) {
    case 'timetable': return <FiCalendar size={size} />;
    case 'assignments': return <FiFileText size={size} />;
    case 'study-room': return <FiBookOpen size={size} />;
    case 'setting': return <FiSettings size={size} />;
    default: return <FiFolder size={size} />;
  }
};

const SidebarContent: React.FC<{
  links: ChapterLink[];
  activeId: string;
  onNavigate: (id: string) => void;
  closeMenu: () => void;
}> = ({ links, activeId, onNavigate, closeMenu }) => {
  const handleNavigate = (id: string) => {
    onNavigate(id);
    closeMenu();
  };
  
  return (
    <div className="flex flex-col h-full pt-4 md:pt-6 overflow-y-auto">
      <h2 className="text-lg font-bold text-white light:text-slate-800 mb-6 px-2 transition-colors duration-300">メニュー</h2>
      
      {/* 通常のメニュー項目 */}
      <ul className="space-y-2 px-2">
        {/* 🌟 修正: idが 'setting' 以外のものだけを抽出してから map で描画する */}
        {links
          .filter(link => link.id !== 'setting')
          .map(link => (
          <li key={link.id}>
            <button
              onClick={() => handleNavigate(link.id)}
              className={`w-full flex items-center text-left p-3 rounded-lg transition-colors duration-200 text-sm font-medium ${
                activeId === link.id
                  ? 'bg-cyan-500 text-white shadow-lg'
                  : 'text-gray-300 light:text-slate-600 hover:bg-slate-700/80 light:hover:bg-slate-200'
              }`}
            >
              <span className={`${activeId === link.id ? 'text-white' : 'text-slate-400 light:text-slate-500'}`}>
                {getChapterIcon(link.id, 20)}
              </span>
              <span className="ml-3">{link.label}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* 🌟 設定項目のブロック (固定で表示) */}
      <div className="mt-6 px-2 pb-4">
        <hr className="border-t border-white/10 light:border-slate-300 mb-4 transition-colors duration-300" />
        
        <button 
          onClick={() => handleNavigate('setting')}
          className={`w-full flex items-center text-left p-2.5 rounded-lg transition-colors duration-200 ${
            activeId === 'setting' 
              ? 'bg-cyan-500 text-white shadow-lg' 
              : 'text-gray-400 light:text-slate-500 hover:bg-slate-700/80 light:hover:bg-slate-200'
          }`}
        >
          <span className={`${activeId === 'setting' ? 'text-white' : 'text-slate-400 light:text-slate-500'}`}>
            <FiSettings size={18} />
          </span>
          <span className="font-medium text-xs ml-3">設定</span>
        </button>
      </div>
      
    </div>
  );
};

export default function Layout() {
  const { isMobileMenuOpen, setIsMobileMenuOpen, chapterLinks, activeChapter, setActiveChapter } = useSidebar();
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);
  const isDraggingRef = useRef<boolean | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      isDraggingRef.current = null;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = currentX - touchStartRef.current.x;
      const diffY = currentY - touchStartRef.current.y;
      if (isDraggingRef.current === null) {
        if (Math.abs(diffX) > 5 || Math.abs(diffY) > 5) isDraggingRef.current = Math.abs(diffX) > Math.abs(diffY);
      }
      if (isDraggingRef.current === true && e.cancelable) e.preventDefault(); 
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      if (isDraggingRef.current === true) {
        const diffX = e.changedTouches[0].clientX - touchStartRef.current.x;
        const minSwipeDistance = 30;
        if (!isMobileMenuOpen && diffX > minSwipeDistance) setIsMobileMenuOpen(true);
        else if (isMobileMenuOpen && diffX < -minSwipeDistance) setIsMobileMenuOpen(false);
      }
      touchStartRef.current = null;
      isDraggingRef.current = null;
    };
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobileMenuOpen, setIsMobileMenuOpen]);

  return (
    <div 
      ref={containerRef}
      className="h-[100dvh] bg-slate-900 light:bg-slate-50 text-slate-300 light:text-slate-800 overflow-hidden relative overscroll-x-none touch-pan-y transition-colors duration-300"
    >
      {/* ① スマホ用サイドメニュー (元のまま: 背面に配置し、メインコンテンツがスライドする) */}
      {chapterLinks.length > 0 && (
        <div className="md:hidden fixed inset-y-0 left-0 w-80 bg-slate-900 light:bg-white z-0 p-4 border-r border-white/10 light:border-slate-200">
          <SidebarContent links={chapterLinks} activeId={activeChapter} onNavigate={setActiveChapter} closeMenu={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* 🌟 追加: タブレット用オーバーレイサイドメニュー (Geminiスタイル) */}
      {chapterLinks.length > 0 && (
        <>
          {/* メニュー外の半透明背景 */}
          <div 
            className={`hidden md:block lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-[1px] transition-opacity duration-300 ${
              isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`} 
            onClick={() => setIsMobileMenuOpen(false)} 
            aria-hidden="true" 
          />
          {/* メニュー本体 */}
          <div 
            className={`hidden md:flex lg:hidden fixed inset-y-0 left-0 w-80 bg-slate-900 light:bg-white z-50 p-4 border-r border-white/10 light:border-slate-200 transition-transform duration-300 ease-out ${
              isMobileMenuOpen ? 'translate-x-0 shadow-[15px_0_30px_rgba(0,0,0,0.5)]' : '-translate-x-full'
            }`}
          >
            <SidebarContent links={chapterLinks} activeId={activeChapter} onNavigate={setActiveChapter} closeMenu={() => setIsMobileMenuOpen(false)} />
          </div>
        </>
      )}

      {/* ② メイン画面のラッパー */}
      <div 
        className={`relative z-10 flex flex-col h-full bg-slate-900 light:bg-slate-50 transition-transform duration-300 ease-out ${
          isMobileMenuOpen ? 'translate-x-80 md:translate-x-0 shadow-[-15px_0_30px_rgba(0,0,0,0.5)]' : 'translate-x-0'
        }`}
      >
        {/* スマホ用の半透明背景 */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute inset-0 bg-black/40 z-50 backdrop-blur-[1px]" onClick={() => setIsMobileMenuOpen(false)} aria-hidden="true" />
        )}

        {/* ヘッダー */}
        <nav className="absolute top-0 left-0 w-full z-20 bg-slate-800/70 light:bg-white/70 backdrop-blur-lg border-b border-white/10 light:border-slate-200">
          <div className="flex items-center justify-between h-15 md:h-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-4">
              {/* 🌟 変更: タブレットでもメニューボタンを表示させるために md:hidden を lg:hidden に変更 */}
              {chapterLinks.length > 0 && (
                <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-300 light:text-slate-600">
                  <FiMenu size={24} />
                </button>
              )}
              <Link to="/" className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-500 to-purple-500">MyFMS</Link>
            </div>
          </div>
        </nav>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-y-auto w-full pb-20 md:pb-0">
          <div className="flex w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            {/* 🌟 変更: PC用静的サイドメニューの表示を md:flex から lg:flex に変更 */}
            {chapterLinks.length > 0 && (
              <aside className="hidden lg:flex sticky top-0 self-start h-screen w-64 flex-shrink-0 bg-slate-900/60 light:bg-white/60 border-r border-white/10 light:border-slate-200 p-4 pt-16 flex-col justify-between z-10">
                <SidebarContent links={chapterLinks} activeId={activeChapter} onNavigate={setActiveChapter} closeMenu={() => {}} />
              </aside>
            )}
            <main className="flex-1 min-w-0 relative z-10">
              <Outlet />
            </main>
          </div>
        </div>

        {/* ③ ボトムナビゲーション (元のまま: スマホのみ表示) */}
        <nav className="md:hidden absolute bottom-0 left-0 w-full z-30 bg-slate-900/95 light:bg-white/95 backdrop-blur-md border-t border-slate-700/50 light:border-slate-200 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          <ul className="flex justify-around items-center h-14 px-1">
            {chapterLinks.map(link => (
              <li key={link.id} className="flex-1">
                <button
                  onClick={() => setActiveChapter(link.id)}
                  className={`w-full flex flex-col items-center justify-center space-y-1 transition-colors duration-200 ${
                    activeChapter === link.id ? 'text-cyan-400 light:text-cyan-600' : 'text-slate-500'
                  }`}
                >
                  {getChapterIcon(link.id, 24)}
                  <span className="text-[10px] font-bold">{link.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}