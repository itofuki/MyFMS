import { createContext, useState, useContext, type ReactNode } from 'react';

// チャプターリンクの型
export type ChapterLink = {
  id: string;
  label: string;
};

// Contextが持つデータの型
type SidebarContextType = {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  chapterLinks: ChapterLink[];
  setChapterLinks: (links: ChapterLink[]) => void;
  activeChapter: string;
  setActiveChapter: (id: string) => void;
};

// Contextを作成（初期値を設定）
const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// Contextを提供するためのProviderコンポーネント
export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [chapterLinks, setChapterLinks] = useState<ChapterLink[]>([]);
  const [activeChapter, setActiveChapter] = useState<string>('');

  const value = {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    chapterLinks,
    setChapterLinks,
    activeChapter,
    setActiveChapter,
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

// Contextを簡単に使うためのカスタムフック
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};