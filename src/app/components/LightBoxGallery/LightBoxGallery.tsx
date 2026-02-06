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
    const initLightbox = async () => {
      const GLightboxModule = (await import('glightbox')).default;
      
      lightboxRef.current = GLightboxModule({
        touchNavigation: true,
        loop: true,
        selector: '.glightbox',
        openEffect: 'zoom',
        closeEffect: 'fade',
      });

      lightboxRef.current.on('open', () => {
        const container = document.querySelector('.gcontainer');
        
        if (container) {
          container.addEventListener('click', (e: Event) => {
            const target = e.target as HTMLElement;
            
            if (
              target.classList.contains('gslide-media') || 
              target.classList.contains('gslide-inner-content') ||
              target.classList.contains('gcontainer') ||
              target.closest('.gslide-description')
            ) {
              return;
            }

            const isImage = target.tagName.toLowerCase() === 'img';
            
            if (!isImage) {
              lightboxRef.current.close();
            }
          });
        }
      });
    };

    initLightbox();

    return () => {
      if (lightboxRef.current) {
        lightboxRef.current.destroy();
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
          <div className={styles.caption}>
            <span>{img.description}</span>
          </div>
        </a>
      ))}
    </div>
  );
}