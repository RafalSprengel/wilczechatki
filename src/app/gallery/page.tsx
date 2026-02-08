'use client'

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import styles from './page.module.css';
import LightBoxGallery from '@components/LightBoxGallery/LightBoxGallery';

const images = [
    { full: '/gallery/wnetrze1.webp', thumb: '/gallery/wnetrze1-thumb.webp', description: 'Wnętrze' },
    { full: '/gallery/wnetrze2.webp', thumb: '/gallery/wnetrze2-thumb.webp', description: 'Wnętrze' },
    { full: '/gallery/wnetrze3.webp', thumb: '/gallery/wnetrze3-thumb.webp', description: 'Wnętrze' },
    { full: '/gallery/wnetrze4.webp', thumb: '/gallery/wnetrze4-thumb.webp', description: 'Wnętrze' },
    { full: '/gallery/wnetrze5.webp', thumb: '/gallery/wnetrze5-thumb.webp', description: 'Wnętrze' },
    { full: '/gallery/wnetrze6.webp', thumb: '/gallery/wnetrze6-thumb.webp', description: 'Wnętrze' },
    { full: '/gallery/wnetrze7.webp', thumb: '/gallery/wnetrze7-thumb.webp', description: 'Wnętrze' },
    { full: '/gallery/sypialnia1.webp', thumb: '/gallery/sypialnia1-thumb.webp', description: 'Sypialnia' },
    { full: '/gallery/sypialnia2.webp', thumb: '/gallery/sypialnia2-thumb.webp', description: 'Sypialnia' },
    { full: '/gallery/sypialnia3.webp', thumb: '/gallery/sypialnia3-thumb.webp', description: 'Sypialnia' },
    { full: '/gallery/sypialnia4.webp', thumb: '/gallery/sypialnia4-thumb.webp', description: 'Sypialnia' },
    { full: '/gallery/lazienka1.webp', thumb: '/gallery/lazienka1-thumb.webp', description: 'Łazienka' },
    { full: '/gallery/kuchnia1.webp', thumb: '/gallery/kuchnia1-thumb.webp', description: 'Kuchnia' },
    { full: '/gallery/kuchnia2.webp', thumb: '/gallery/kuchnia2-thumb.webp', description: 'Kuchnia' },
    { full: '/gallery/kuchnia3.webp', thumb: '/gallery/kuchnia3-thumb.webp', description: 'Kuchnia' },
    { full: '/gallery/zagroda1.webp', thumb: '/gallery/zagroda1-thumb.webp', description: 'Zagroda' },
    { full: '/gallery/zagroda2.webp', thumb: '/gallery/zagroda2-thumb.webp', description: 'Zagroda' },
    { full: '/gallery/zagroda3.webp', thumb: '/gallery/zagroda3-thumb.webp', description: 'Zagroda' },
    { full: '/gallery/zwierzeta1.webp', thumb: '/gallery/zwierzeta1-thumb.webp', description: 'Zwierzęta' },
    { full: '/gallery/zwierzeta2.webp', thumb: '/gallery/zwierzeta2-thumb.webp', description: 'Zwierzęta' },
    { full: '/gallery/zwierzeta3.webp', thumb: '/gallery/zwierzeta3-thumb.webp', description: 'Zwierzęta' },
    { full: '/gallery/zwierzeta4.webp', thumb: '/gallery/zwierzeta4-thumb.webp', description: 'Zwierzęta' },
    { full: '/gallery/zwierzeta5.webp', thumb: '/gallery/zwierzeta5-thumb.webp', description: 'Zwierzęta' },
    { full: '/gallery/okolica1.webp', thumb: '/gallery/okolica1-thumb.webp', description: 'Okolica' },
    { full: '/gallery/okolica2.webp', thumb: '/gallery/okolica2-thumb.webp', description: 'Okolica' },
    { full: '/gallery/okolica3.webp', thumb: '/gallery/okolica3-thumb.webp', description: 'Okolica' },
    { full: '/gallery/okolica4.webp', thumb: '/gallery/okolica4-thumb.webp', description: 'Okolica' },
    { full: '/gallery/okolica5.webp', thumb: '/gallery/okolica5-thumb.webp', description: 'Okolica' }
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