import { useState } from 'react';
// Framer MotionからAnimatePresenceをインポート
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

// 型定義
type ItemProps = {
  id: number;
  title: string;
  imageUrl: string;
};

type SimpleCarouselProps = {
  items: ItemProps[];
};

export default function SimpleCarousel({ items }: SimpleCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!items || items.length === 0) {
    return <div>表示するアイテムがありません。</div>;
  }

  const handlePrev = () => {
    // 最初の画像で「前へ」を押したら、最後の画像に移動
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    // 最後の画像で「次へ」を押したら、最初の画像に移動
    setActiveIndex((prev) => (prev + 1) % items.length);
  };

  // 表示する現在のアイテム
  const currentItem = items[activeIndex];

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* 画像を表示するコンテナ */}
      <div className="relative w-full h-[300px] rounded-2xl shadow-xl overflow-hidden">
        {/* 👇 AnimatePresenceでアニメーションの対象を囲む */}
        <AnimatePresence mode="wait">
          {/* 👇 motion.imgを使い、keyにユニークな値を指定 */}
          <motion.img
            key={currentItem.id} // keyが変わるとアニメーションが発火
            src={currentItem.imageUrl}
            alt={currentItem.title}
            className="absolute w-full h-full object-cover"
            // 👇 アニメーションの定義
            initial={{ opacity: 0, x: 50 }}  // 初期状態（透明で右に50pxずれている）
            animate={{ opacity: 1, x: 0 }}   // 表示されるとき（不透明になり、元の位置に戻る）
            exit={{ opacity: 0, x: -50 }}   // 消えるとき（透明になり、左に50pxずれる）
            transition={{ duration: 0.5, ease: "easeInOut" }} // アニメーションの時間と種類
          />
        </AnimatePresence>
        
        {/* タイトル表示 */}
        <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent">
          <h3 className="text-xl font-bold text-white shadow-lg">{currentItem.title}</h3>
        </div>
      </div>

      {/* 操作ボタン */}
      <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-4">
        <button 
          onClick={handlePrev} 
          className="p-3 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <button 
          onClick={handleNext} 
          className="p-3 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}