import { Outlet, Link } from "react-router-dom";
import { Toaster } from 'sonner';
import { useSidebar, type ChapterLink } from "../contexts/SidebarContext";
import { FiMenu, FiSettings } from "react-icons/fi";
import { motion, AnimatePresence } from 'framer-motion';

// ▼▼▼ このChapterNavigationコンポーネントを、より高機能なレスポンシブ対応版に書き換えます ▼▼▼
const ChapterNavigation: React.FC<{
  links: ChapterLink[];
  activeId: string;
  onNavigate: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}> = ({ links, activeId, onNavigate, isOpen, setIsOpen }) => {

  const handleNavigate = (id: string) => {
    onNavigate(id);
    setIsOpen(false); // リンククリックでモバイルメニューを閉じる
  };

  // メニューのコンテンツ部分を共通化
  const menuContent = (
    <>
      <div className="pt-8 md:pt-18">
        <h2 className="text-lg font-bold text-white mb-6 px-2">メニュー</h2>
        <ul className="space-y-2">
          {links.map(link => (
            <li key={link.id}>
              <button
                onClick={() => handleNavigate(link.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors duration-200 text-sm font-medium ${
                  // ここで現在いるチャプターに色をつけています
                  activeId === link.id
                    ? 'bg-cyan-500 text-white shadow-lg' // アクティブな時のスタイル
                    : 'text-gray-300 hover:bg-slate-700/80' // 非アクティブな時のスタイル
                }`}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {/* スマホ版・PC版の両方で一番下に設定リンクを配置 */}
      <div>
        <Link to="/setting" className="flex items-center gap-3 p-3 rounded-lg text-slate-400 hover:bg-slate-700/80 hover:text-cyan-400 transition-colors duration-200">
          <FiSettings size={20} className="glowing-gear" />
          <span className="font-medium text-sm">設定</span>
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* PC用サイドバー（静的） */}
      <nav className="w-48 flex-shrink-0 p-4 bg-slate-900/60 border-r border-white/10 hidden md:flex flex-col justify-between">
        {menuContent}
      </nav>

      {/* モバイル用スライドメニュー（アニメーション付き） */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 z-30 md:hidden"
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-full w-64 p-4 bg-slate-900 border-r border-white/10 z-40 md:hidden flex flex-col justify-between"
            >
              {menuContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};


export default function Layout() {
  const { isMobileMenuOpen, setIsMobileMenuOpen, chapterLinks, activeChapter, setActiveChapter } = useSidebar();

  return (
    <div className="min-h-screen text-slate-300">
      <nav className="fixed top-0 left-0 w-full z-20 bg-slate-800/70 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between h-15 md:h-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            {/* ハンバーガーメニュー (チャプターがあるページでのみ表示) */}
            {chapterLinks.length > 0 && (
              <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-slate-300" aria-label="メニューを開く">
                <FiMenu size={24} />
              </button>
            )}
            {/* ロゴ */}
            <Link to="/" className="text-2xl item-center font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-500 to-purple-500 hover:opacity-90 transition-opacity">
                MyFMS
            </Link>
          </div>
        </div>
      </nav>
      
      <div className="flex h-screen">
        {/* チャプターがあるページでのみサイドバーを表示 */}
        {chapterLinks.length > 0 && (
          <ChapterNavigation
            links={chapterLinks}
            activeId={activeChapter}
            onNavigate={setActiveChapter}
            isOpen={isMobileMenuOpen}
            setIsOpen={setIsMobileMenuOpen}
          />
        )}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <Toaster
        position="top-right"
      />
    </div>
  );
}