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

export default function LightBoxGallery({ images }: LightBoxGalleryProps) {
  const lightboxRef = useRef<any>(null);

  useEffect(() => {
    let lightboxInstance: any = null;

    const initLightbox = async () => {
      const GLightboxModule = (await import('glightbox')).default;

      // Inicjalizujemy lightbox
      lightboxInstance = GLightboxModule({
        touchNavigation: true,
        loop: true,
        selector: '.glightbox',
        openEffect: 'zoom',
        closeEffect: 'fade',
      });

      lightboxRef.current = lightboxInstance;
    };

    initLightbox();

    return () => {
      if (lightboxInstance) {
        lightboxInstance.destroy();
      }
    };
  }, [images]);

  return (
    <div className={styles.galleryWrapper}>
      <div className={styles.gallery}>
        {images.map((img, index) => (
          <a
            href={img.full}
            className={`glightbox ${styles.imageLink}`}
            data-gallery="my-gallery"
            key={`${img.full}-${index}`}
          >
            <img
              src={img.thumb}
              alt={img.description || `Gallery item ${index + 1}`}
              className={styles.image}
            />
            <div className={styles.caption}>
              <span>{img.description}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}