import { useState, useRef, useEffect } from 'react';
import './RotatingCarousel.css'; // 新しいCSSファイル

type CarouselItem = {
  id: number;
  title: string;
  imageUrl: string;
};

type Props = {
  items: CarouselItem[];
};

export default function RotatingCarousel({ items }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- 中央揃えの計算と適用 ---
  useEffect(() => {
    const centerSlide = () => {
      if (!trackRef.current || !containerRef.current) return;
      
      const container = containerRef.current;
      const slides = Array.from(trackRef.current.children) as HTMLElement[];
      const targetSlide = slides[currentIndex];

      if (!targetSlide) return;

      // コンテナの中心とスライドの中心の差分を計算して移動量を決める
      const containerCenter = container.getBoundingClientRect().width / 2;
      const slideCenter = targetSlide.offsetLeft + targetSlide.getBoundingClientRect().width / 2;
      const translateX = containerCenter - slideCenter;
      
      trackRef.current.style.transform = `translateX(${translateX}px)`;
    };

    centerSlide();

    // ウィンドウリサイズ時にも再計算
    window.addEventListener('resize', centerSlide);
    return () => {
      window.removeEventListener('resize', centerSlide);
    };
  }, [currentIndex, items]);


  // --- ボタン操作 ---
  const handlePrev = () => {
    // インデックスを一つ前に（最初の場合は最後にループ）
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    // インデックスを一つ次に（最後の場合は最初にループ）
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
  };
  
  return (
    <div className="centered-carousel-container" ref={containerRef}>
      <div className="centered-carousel-track" ref={trackRef}>
        {items.map((item, index) => (
          <div 
            className={`centered-carousel-slide ${index === currentIndex ? 'is-active' : ''}`} 
            key={item.id}
          >
            <img 
              src={item.imageUrl} 
              alt={item.title} 
              className="centered-carousel-image"
            />
            <div className="centered-carousel-slide-title">{item.title}</div>
          </div>
        ))}
      </div>
      <button className="centered-carousel-button prev" onClick={handlePrev}>‹</button>
      <button className="centered-carousel-button next" onClick={handleNext}>›</button>
    </div>
  );
}