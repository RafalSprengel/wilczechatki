'use client'

import styles from './page.module.css';
 import LightBoxGallery from '@components/LightBoxGallery/LightBoxGallery';
const images = [
    {
        full: '/gallery/img1.webp',
        thumb: '/gallery/img1-thumb.webp',
        description: 'Opis obrazka 1'
    },
    {
        full: '/gallery/img2.webp',
        thumb: '/gallery/img2-thumb.webp',
        description: 'Opis obrazka 2'
    },
    {
        full: '/gallery/img3.webp',
        thumb: '/gallery/img3-thumb.webp',
        description: 'Opis obrazka 3'
    },
    {
        full: '/gallery/img4.webp',
        thumb: '/gallery/img4-thumb.webp',
        description: 'Opis obrazka 4'
    },
    {
        full: '/gallery/img5.webp',
        thumb: '/gallery/img5-thumb.webp',
        description: 'Opis obrazka 5'
    }
]

export default function Gallery() {
    return (
        <div className={styles.container}>
            <div className={styles.title}>
                <h2>Galeria zdjęć</h2>
            </div>
            <div className='galleryWrap'>
                <LightBoxGallery images={images} />
            </div>

        </div>
    );

}