import styles from './GallerySection.module.css';
import LightBoxGallery from '@components/LightBoxGallery/LightBoxGallery';


export default function GallerySection() {

    const images = [
        { full: '/gallery/wnetrze1.webp', thumb: '/gallery/wnetrze1-thumb.webp', description: 'Wnętrze' },
        { full: '/gallery/wnetrze2.webp', thumb: '/gallery/wnetrze2-thumb.webp', description: 'Wnętrze' },
        { full: '/gallery/wnetrze3.webp', thumb: '/gallery/wnetrze3-thumb.webp', description: 'Wnętrze' },
        { full: '/gallery/wnetrze4.webp', thumb: '/gallery/wnetrze4-thumb.webp', description: 'Wnętrze' },
        { full: '/gallery/wnetrze5.webp', thumb: '/gallery/wnetrze5-thumb.webp', description: 'Wnętrze' },
        { full: '/gallery/wnetrze6.webp', thumb: '/gallery/wnetrze6-thumb.webp', description: 'Wnętrze' },
        { full: '/gallery/wnetrze7.webp', thumb: '/gallery/wnetrze7-thumb.webp', description: 'Wnętrze' },
        { full: '/gallery/sypialnia1.webp', thumb: '/gallery/sypialnia1-thumb.webp', description: 'Sypialnia' },
    ];

    return (
        <section id='gallery-section'>
            <div className={styles.title}>
                <h2>Galeria zdjęć</h2>
            </div>
            <div className={styles.galleryWrap}>
                <LightBoxGallery images={images} />
            </div>
            <a href="/gallery" className={styles.link}>Zobacz więcej &raquo;</a>
        </section>
    );
}