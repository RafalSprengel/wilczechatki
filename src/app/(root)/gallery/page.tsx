'use client'

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import styles from './page.module.css';
import LightBoxGallery from '@components/LightBoxGallery/LightBoxGallery';

const images = [
    { full: '/gallery/wnetrze1.webp', thumb: '/gallery/wnetrze1-thumb.webp', description: '' },
    { full: '/gallery/wnetrze2.webp', thumb: '/gallery/wnetrze2-thumb.webp', description: '' },
    { full: '/gallery/wnetrze3.webp', thumb: '/gallery/wnetrze3-thumb.webp', description: '' },
    { full: '/gallery/wnetrze4.webp', thumb: '/gallery/wnetrze4-thumb.webp', description: '' },
    { full: '/gallery/wnetrze5.webp', thumb: '/gallery/wnetrze5-thumb.webp', description: '' },
    { full: '/gallery/wnetrze6.webp', thumb: '/gallery/wnetrze6-thumb.webp', description: '' },
    { full: '/gallery/wnetrze7.webp', thumb: '/gallery/wnetrze7-thumb.webp', description: '' },
    { full: '/gallery/sypialnia1.webp', thumb: '/gallery/sypialnia1-thumb.webp', description: '' },
    { full: '/gallery/sypialnia2.webp', thumb: '/gallery/sypialnia2-thumb.webp', description: '' },
    { full: '/gallery/sypialnia3.webp', thumb: '/gallery/sypialnia3-thumb.webp', description: '' },
    { full: '/gallery/sypialnia4.webp', thumb: '/gallery/sypialnia4-thumb.webp', description: '' },
    { full: '/gallery/lazienka1.webp', thumb: '/gallery/lazienka1-thumb.webp', description: '' },
    { full: '/gallery/kuchnia1.webp', thumb: '/gallery/kuchnia1-thumb.webp', description: '' },
    { full: '/gallery/kuchnia2.webp', thumb: '/gallery/kuchnia2-thumb.webp', description: '' },
    { full: '/gallery/kuchnia3.webp', thumb: '/gallery/kuchnia3-thumb.webp', description: '' },
    { full: '/gallery/zagroda1.webp', thumb: '/gallery/zagroda1-thumb.webp', description: '' },
    { full: '/gallery/zagroda2.webp', thumb: '/gallery/zagroda2-thumb.webp', description: '' },
    { full: '/gallery/zagroda3.webp', thumb: '/gallery/zagroda3-thumb.webp', description: '' },
    { full: '/gallery/zwierzeta1.webp', thumb: '/gallery/zwierzeta1-thumb.webp', description: '' },
    { full: '/gallery/zwierzeta2.webp', thumb: '/gallery/zwierzeta2-thumb.webp', description: '' },
    { full: '/gallery/zwierzeta3.webp', thumb: '/gallery/zwierzeta3-thumb.webp', description: '' },
    { full: '/gallery/zwierzeta4.webp', thumb: '/gallery/zwierzeta4-thumb.webp', description: '' },
    { full: '/gallery/zwierzeta5.webp', thumb: '/gallery/zwierzeta5-thumb.webp', description: '' },
    { full: '/gallery/okolica1.webp', thumb: '/gallery/okolica1-thumb.webp', description: '' },
    { full: '/gallery/okolica2.webp', thumb: '/gallery/okolica2-thumb.webp', description: '' },
    { full: '/gallery/okolica3.webp', thumb: '/gallery/okolica3-thumb.webp', description: '' },
    { full: '/gallery/okolica4.webp', thumb: '/gallery/okolica4-thumb.webp', description: '' },
    { full: '/gallery/okolica5.webp', thumb: '/gallery/okolica5-thumb.webp', description: '' }
];

export default function Gallery() {
    return (
        <div className={styles.gallerySection_container}>
            <div className={styles.gallerySection_title}>
                <h2>Galeria zdjęć</h2>
            </div>
            <div className={styles.gallerySection_galleryWrap}>
                <LightBoxGallery images={images} />
            </div>

            <div className={styles.backButton_wrapper}>
                <Link href="/#gallery-section" className={styles.backButton}>
                   <span className={styles.icon}>&laquo;</span> Powrót
                </Link>
            </div>
        </div>
    );
}