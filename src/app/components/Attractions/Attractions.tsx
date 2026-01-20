import styles from './Attractions.module.css';

export default function Attractions() {
    const locations = [
        'Kaszubski Park Krajobrazowy',
        'Wieżyca – najwyższe wzniesienie',
        'Szymbark – Centrum Edukacji',
        'Skansen we Wdzydzach Kiszewskich',
        'Jeziora Kaszubskie i szlaki'
    ];

    return (
        <section id="attractions" className={styles.section}>
            <h2>Atrakcje w okolicy 🌲</h2>
            <div className={styles.wrapper}>
                {locations.map((location, idx) => (
                    <div key={idx} className={styles.attractionItem}>
                        <span className={styles.icon}>•</span>
                        <p>{location}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}