'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './HeroSlider.module.css';

interface SliderItem {
  id: number;
  title: string;
  topic: string;
  description: string;
  image: string;
}

const items: SliderItem[] = [
  { 
    id: 1, 
    title: 'Wilcze chatki', 
    topic: 'Kaszubska cisza', 
    description: 'Dwa przytulne domki w Szumlesiu Królewskim, idealne na odpoczynek od miejskiego zgiełku.', 
    image: '/images/img1.jpeg' 
  },
  { 
    id: 2, 
    title: 'Strefa relaksu', 
    topic: 'Sauna i jacuzzi', 
    description: 'Całoroczna strefa relaksu w zamkniętej altanie z sauną infrared i jacuzzi ogrzewanym drewnem.', 
    image: '/images/img2.jpeg' 
  },
  { 
    id: 3, 
    title: 'Natura na wyciągnięcie ręki', 
    topic: 'Serce Kaszub', 
    description: 'Bliskość Kaszubskiego Parku Krajobrazowego, Wieżycy i malowniczych jezior.', 
    image: '/images/img3.jpeg' 
  },
  { 
    id: 4, 
    title: 'Rodzinny wypoczynek', 
    topic: 'Plac zabaw i grill', 
    description: 'Prywatny taras z grillem oraz plac zabaw z trampoliną i huśtawkami dla najmłodszych.', 
    image: '/images/img4.jpeg' 
  },
  { 
    id: 5, 
    title: 'Komfortowe domki', 
    topic: 'Pełne wyposażenie', 
    description: 'Klimatyzowane wnętrza, aneks kuchenny i przytulne sypialnie na poddaszu dla 6-8 osób.', 
    image: '/images/img5.jpeg' 
  },
];



export default function HeroSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleNext = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((prev) => (prev + 1) % items.length);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating]);

  const handlePrev = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      handleNext();
    }, 7000);
  }, [handleNext]);

  const changeSlide = useCallback((newIndex: number) => {
    if (isAnimating || newIndex === activeIndex) return;

    setIsAnimating(true);
    setActiveIndex(newIndex);
    startTimer();

    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating, activeIndex, startTimer]);

  useEffect(() => {
    setIsMounted(true);
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  return (
    <section className={styles.heroSlider}>
      <div className={styles.sliderMain}>
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`${styles.slide} ${isMounted && index === activeIndex ? styles.active : ''}`}
          >
            <div className={styles.overlay}></div>
            <img src={item.image} alt={item.title} className={styles.slideImg} />

            <div className={styles.slideContent}>
              <span className={styles.slideSubtitle}>SZUMLEŚ KRÓLEWSKI</span>
              <h1 className={styles.slideTitle}>{item.title}</h1>
              <h2 className={styles.slideTopic}>{item.topic}</h2>
              <p className={styles.slideDesc}>{item.description}</p>
              <div className={styles.slideActions}>
                <button className={styles.btnPrimary}>ZAREZERWUJ</button>
                <button className={styles.btnOutline}>GALERIA</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.sliderControls}>
        <div className={styles.thumbnailsContainer}>
          {items.map((item, index) => (
            <div
              key={`thumb-${item.id}`}
              className={`${styles.thumbItem} ${index === activeIndex ? styles.activeThumb : ''}`}
              onClick={() => changeSlide(index)}
            >
              <img src={item.image} alt="" />
              {index === activeIndex && <div className={styles.thumbProgress} />}
            </div>
          ))}
        </div>

        <div className={styles.bottomNav}>
          <div className={styles.paginationDots}>
            {items.map((_, index) => (
              <span
                key={index}
                className={`${styles.dot} ${index === activeIndex ? styles.activeDot : ''}`}
              />
            ))}
          </div>
          <div className={styles.arrows}>
            <button onClick={handlePrev} className={styles.arrow}>←</button>
            <button onClick={handleNext} className={styles.arrow}>→</button>
          </div>
        </div>
      </div>
    </section>
  );
}