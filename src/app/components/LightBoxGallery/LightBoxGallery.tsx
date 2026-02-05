'use client'

import { useEffect, useRef } from 'react';
import styles from './LightBoxGallery.module.css';
import 'glightbox/dist/css/glightbox.min.css';

interface ImageProps {
  full: string;
  thumb: string;
  description?: string;
}

interface LightBoxGalleryProps {
  images: ImageProps[];
}

interface GLightboxInstance {
  destroy: () => void;
  open: () => void;
  close: () => void;
}

export default function LightBoxGallery({ images }: LightBoxGalleryProps) {
  const lightboxRef = useRef<GLightboxInstance | null>(null);

  useEffect(() => {
    const initLightbox = async () => {
      const GLightboxModule = (await import('glightbox')).default;
      
      lightboxRef.current = GLightboxModule({
        touchNavigation: true,
        loop: true,
        autoplayVideos: true,
        selector: '.glightbox'
      }) as GLightboxInstance;
    };

    initLightbox();

    return () => {
      if (lightboxRef.current) {
        lightboxRef.current.destroy();
        lightboxRef.current = null;
      }
    };
  }, [images]);

  return (
    <div className={styles.container}>
      {images.map((img, index) => (
        <a
          href={img.full}
          className={`glightbox ${styles.imageLink}`}
          data-gallery="my-gallery"
          data-aos="fade-up"
          data-aos-delay={index * 100}
          key={index}
        >
          <img
            src={img.thumb}
            alt={img.description || `Gallery item ${index + 1}`}
            className={styles.image}
          />
        </a>
      ))}
    </div>
  );
}