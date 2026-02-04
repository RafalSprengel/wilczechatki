'use client'

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import styles from './LightBoxGallery.module.css';
import 'glightbox/dist/css/glightbox.min.css';

const GLightbox : any = dynamic (() => import('glightbox') as any, { ssr: false });

interface ImageProps {
  full: string;
  thumb: string;
  description?: string;
}

interface LightBoxGalleryProps {
  images: ImageProps[];
}

export default function LightBoxGallery({ images }: LightBoxGalleryProps) {

  useEffect(() => {
    const lightbox = GLightbox({
      touchNavigation: true,
      loop: true,
      autoplayVideos: true
    });

    return () => {
      lightbox.destroy();
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
};