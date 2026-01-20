'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import './HeroSlider.css';

interface SliderItem {
  id: number;
  title: string;
  topic: string;
  description: string;
  image: string;
}

const items: SliderItem[] = [
  { id: 1, title: 'WILCZE CHATKI', topic: 'KASZUBY', description: 'Odkryj magię Szumlesia Królewskiego w luksusowych domkach z sauną.', image: '/images/img1.jpeg' },
  { id: 2, title: 'REJSY I RELAKS', topic: 'NATURA', description: 'Ciesz się kojącym szumem drzew i prywatnym jakuzzi pod gwiazdami.', image: '/images/img2.jpeg' },
  { id: 3, title: 'PRZYGODA', topic: 'AKTYWNIE', description: 'Najlepsze szlaki rowerowe i jeziora Kaszub na wyciągnięcie ręki.', image: '/images/img3.jpeg' },
  { id: 4, title: 'CIEPŁO DOMU', topic: 'KOMINEK', description: 'Poczuj wyjątkowy klimat wieczorów przy trzaskającym ogniu.', image: '/images/img4.jpeg' },
];

export default function HeroSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      handleNext();
    }, 8000);
  }, [activeIndex]);

  const changeSlide = useCallback((newIndex: number) => {
    if (isAnimating || newIndex === activeIndex) return;
    
    setIsAnimating(true);
    setActiveIndex(newIndex);
    
    setTimeout(() => setIsAnimating(false), 800);
  }, [isAnimating, activeIndex]);

  const handleNext = useCallback(() => {
    changeSlide((activeIndex + 1) % items.length);
  }, [activeIndex, changeSlide]);

  const handlePrev = useCallback(() => {
    changeSlide((activeIndex - 1 + items.length) % items.length);
  }, [activeIndex, changeSlide]);

  useEffect(() => {
    setIsMounted(true);
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  return (
    <section className="hero-slider">
      <div className="slider-main">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`slide ${isMounted && index === activeIndex ? 'active' : ''}`}
          >
            <div className="overlay"></div>
            <img src={item.image} alt={item.title} className="slide-img" />
            
            <div className="slide-content">
              <span className="slide-subtitle">SZUMLEŚ KRÓLEWSKI</span>
              <h1 className="slide-title">{item.title}</h1>
              <h2 className="slide-topic">{item.topic}</h2>
              <p className="slide-desc">{item.description}</p>
              <div className="slide-actions">
                <button className="btn-primary">ZAREZERWUJ</button>
                <button className="btn-outline">GALERIA</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="slider-controls">
        <div className="thumbnails-container">
          {items.map((item, index) => (
            <div
              key={`thumb-${item.id}`}
              className={`thumb-item ${index === activeIndex ? 'active-thumb' : ''}`}
              onClick={() => changeSlide(index)}
            >
              <img src={item.image} alt="" />
              {index === activeIndex && <div className="thumb-progress" />}
            </div>
          ))}
        </div>

        <div className="bottom-nav">
          <div className="pagination-dots">
            {items.map((_, index) => (
              <span key={index} className={`dot ${index === activeIndex ? 'active-dot' : ''}`} />
            ))}
          </div>
          <div className="arrows">
            <button onClick={handlePrev} className="arrow">←</button>
            <button onClick={handleNext} className="arrow">→</button>
          </div>
        </div>
      </div>
    </section>
  );
}