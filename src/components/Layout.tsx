import { useRef, useEffect } from 'react';
import { Outlet, Link } from "react-router-dom";
import { Toaster } from 'sonner';
import { useSidebar, type ChapterLink } from "../contexts/SidebarContext"; // パスは環境に合わせてください
import { FiMenu, FiSettings, FiCalendar, FiFileText, FiBookOpen, FiFolder } from "react-icons/fi";

// 🌟 1. アイコン取得関数を外に出し、メニューとボトムナビの両方で使い回せるようにしました
const getChapterIcon = (id: string, size: number = 20) => {
  switch (id) {
    case 'timetable': return <FiCalendar size={size} />;
    case 'assignments': return <FiFileText size={size} />;
    case 'study-room': return <FiBookOpen size={size} />;
    default: return <FiFolder size={size} />;
  }
};

// ▼▼▼ メニューの中身 ▼▼▼
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
      <h2 className="text-lg font-bold text-white mb-6 px-2">メニュー</h2>
      
      <ul className="space-y-2 px-2">
        {links.map(link => (
          <li key={link.id}>
            <button
              onClick={() => handleNavigate(link.id)}
              className={`w-full flex items-center text-left p-3 rounded-lg transition-colors duration-200 text-sm font-medium ${
                activeId === link.id
                  ? 'bg-cyan-500 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-slate-700/80'
              }`}
            >
              <span className={`${activeId === link.id ? 'text-white' : 'text-slate-400'}`}>
                {getChapterIcon(link.id, 20)}
              </span>
              <span className="ml-3">{link.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 px-2">
        <hr className="border-t border-white/10 mb-4" />
        <button 
          onClick={() => handleNavigate('setting')}
          className={`w-full flex items-center text-left p-3 rounded-lg transition-colors duration-200 text-sm font-medium ${
            activeId === 'setting'
              ? 'bg-cyan-500 text-white shadow-lg'
              : 'text-gray-300 hover:bg-slate-700/80'
          }`}
        >
          <span className={`${activeId === 'setting' ? 'text-white' : 'text-slate-400'}`}>
            <FiSettings size={18} className="glowing-gear" />
          </span>
          <span className="font-medium text-xs ml-3">設定</span>
        </button>
      </div>
    </div>
  );
};


// ▼▼▼ 全体のレイアウトコンポーネント ▼▼▼
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
        if (Math.abs(diffX) > 5 || Math.abs(diffY) > 5) {
          isDraggingRef.current = Math.abs(diffX) > Math.abs(diffY);
        }
      }

      if (isDraggingRef.current === true) {
        if (e.cancelable) {
          e.preventDefault(); 
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      if (isDraggingRef.current === true) {
        const diffX = e.changedTouches[0].clientX - touchStartRef.current.x;
        const minSwipeDistance = 30;

        if (!isMobileMenuOpen && diffX > minSwipeDistance) {
          setIsMobileMenuOpen(true);
        } else if (isMobileMenuOpen && diffX < -minSwipeDistance) {
          setIsMobileMenuOpen(false);
        }
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
      className="min-h-screen bg-slate-900 text-slate-300 overflow-hidden relative overscroll-x-none touch-pan-y"
    >
      {/* ① スマホ用メニュー（最下層に固定配置） */}
      {chapterLinks.length > 0 && (
        <div className="md:hidden fixed inset-y-0 left-0 w-80 bg-slate-900 z-0 p-4 border-r border-white/10">
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
            ? 'translate-x-80 md:translate-x-0 shadow-[-15px_0_30px_rgba(0,0,0,0.2)]'
            : 'translate-x-0'
        }`}
      >
        {isMobileMenuOpen && (
          <div 
            className="md:hidden absolute inset-0 bg-black/40 z-50 backdrop-blur-[1px]"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        <nav className="absolute top-0 left-0 w-full z-20 bg-slate-800/70 backdrop-blur-lg border-b border-white/10">
          <div className="flex items-center justify-between h-15 md:h-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
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

        {/* 🌟 2. 修正: pb-16 を追加して、一番下までスクロールした時にボトムナビに隠れないようにする（PC版では pb-0 で無効化） */}
        <div className="flex-1 overflow-y-auto w-full pb-16 md:pb-0">
          <div className="flex w-full max-w-7xl mx-auto">
            
            {/* PC用サイドバー */}
            {chapterLinks.length > 0 && (
              <aside className="hidden md:flex sticky top-0 self-start h-screen w-64 flex-shrink-0 bg-slate-900/60 border-r border-white/10 p-4 pt-16 flex-col justify-between z-10">
                <SidebarContent
                  links={chapterLinks}
                  activeId={activeChapter}
                  onNavigate={setActiveChapter}
                  closeMenu={() => {}}
                />
              </aside>
            )}

            <main className="flex-1 min-w-0 relative z-10">
              <Outlet />
            </main>
          </div>
        </div>

        {/* 🌟 3. ボトムナビの追加: スライドするメイン画面の中に配置することで、メニューを開いた時に一緒に横へスライドします */}
        <nav className="md:hidden absolute bottom-0 left-0 w-full z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-700/50 pb-2 pt-1">
          <ul className="flex justify-around items-center h-14 px-1">
            {chapterLinks.map(link => (
              <li key={link.id} className="flex-1">
                <button
                  onClick={() => setActiveChapter(link.id)}
                  className={`w-full flex flex-col items-center justify-center space-y-1 transition-colors duration-200 ${
                    activeChapter === link.id ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {getChapterIcon(link.id, 24)}
                  <span className="text-[10px] font-bold">{link.label}</span>
                </button>
              </li>
            ))}

            <li className="flex-1">
              <button
                onClick={() => setActiveChapter('setting')}
                className={`w-full flex flex-col items-center justify-center space-y-1 transition-colors duration-200 ${
                  activeChapter === 'setting' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <FiSettings size={24} />
                <span className="text-[10px] font-bold">設定</span>
              </button>
            </li>
          </ul>
        </nav>

      </div>
      <Toaster position="top-right" />
    </div>
  );
}