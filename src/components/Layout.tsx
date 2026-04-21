import { useRef, useEffect } from 'react';
import { Outlet, Link } from "react-router-dom";
import { Toaster } from 'sonner';
import { useSidebar, type ChapterLink } from "../contexts/SidebarContext";
import { FiMenu, FiSettings, FiCalendar, FiFileText, FiBookOpen, FiFolder } from "react-icons/fi";

// ▼▼▼ メニューの中身（アイコン変更＆設定文字サイズ縮小版） ▼▼▼
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

  // 🌟 アイコンの出し分け（自習室を FiBookOpen に変更）
  const getChapterIcon = (id: string) => {
    switch (id) {
      case 'timetable': return <FiCalendar size={20} />;
      case 'assignments': return <FiFileText size={20} />;
      case 'study-room': return <FiBookOpen size={20} />; // 直感的な「本」のアイコン
      default: return <FiFolder size={20} />;
    }
  };

  return (
    <div className="flex flex-col h-full pt-8 md:pt-18 overflow-y-auto">
      <h2 className="text-lg font-bold text-white mb-6 px-2">メニュー</h2>
      
      {/* チャプターリスト */}
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
              {/* 左側のアイコン */}
              <span className={`${activeId === link.id ? 'text-white' : 'text-slate-400'}`}>
                {getChapterIcon(link.id)}
              </span>
              <span className="ml-3">{link.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 px-2">
        {/* ------- 区切り線 ------- */}
        <hr className="border-t border-white/10 mb-4" />
        
        <Link 
          to="/setting" 
          onClick={closeMenu}
          className="flex items-center p-3 rounded-lg text-slate-400 hover:bg-slate-700/80 hover:text-cyan-400 transition-colors duration-200"
        >
          {/* 設定アイコンも文字に合わせて少しだけ小さく(18px)するとバランスが良いです */}
          <FiSettings size={18} className="glowing-gear" />
          {/* 🌟 文字サイズを text-xs にして小さくしました */}
          <span className="font-medium text-xs ml-3">設定</span>
        </Link>
      </div>
    </div>
  );
};


// ▼▼▼ 全体のレイアウトコンポーネント ▼▼▼
export default function Layout() {
  const { isMobileMenuOpen, setIsMobileMenuOpen, chapterLinks, activeChapter, setActiveChapter } = useSidebar();

  // =================================================================
  // スワイプ検知用の関数（超軽量・激甘判定版）
  // =================================================================
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);

  // true: 横スワイプ中, false: 縦スクロール中, null: まだ判定していない
  const isDraggingRef = useRef<boolean | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      isDraggingRef.current = null; // 指を置いた時はまだ判定しない
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = currentX - touchStartRef.current.x;
      const diffY = currentY - touchStartRef.current.y;

      // 🌟 10pxから「5px」に縮め、ブラウザがスクロールを始める前に素早くロックする
      if (isDraggingRef.current === null) {
        if (Math.abs(diffX) > 5 || Math.abs(diffY) > 5) {
          isDraggingRef.current = Math.abs(diffX) > Math.abs(diffY);
        }
      }

      // 横スワイプとしてロックされた場合、縦スクロールを止める
      if (isDraggingRef.current === true) {
        // 🌟 ここを追加！キャンセル可能な場合のみ実行し、エラーを防ぐ
        if (e.cancelable) {
          e.preventDefault(); 
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      // 「横スワイプ」と判定されていた場合のみメニューの開閉を行う
      if (isDraggingRef.current === true) {
        const diffX = e.changedTouches[0].clientX - touchStartRef.current.x;
        const minSwipeDistance = 30; // 30px以上の横移動で開く

        if (!isMobileMenuOpen && diffX > minSwipeDistance) {
          setIsMobileMenuOpen(true);
        } else if (isMobileMenuOpen && diffX < -minSwipeDistance) {
          setIsMobileMenuOpen(false);
        }
      }

      // 指を離したらリセット
      touchStartRef.current = null;
      isDraggingRef.current = null;
    };

    // passive: false にすることで、ブラウザの標準スクロールを e.preventDefault() で止められるようになります
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobileMenuOpen, setIsMobileMenuOpen]);
  // =================================================================

  return (
    // 🌟 touch-pan-y を復活させます（ブラウザのスクロール誤爆を防ぐお守りです）
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