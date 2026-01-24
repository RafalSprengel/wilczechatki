import styles from './Attractions.module.css';

export default function Attractions() {
    const attractions = [
        {
            title: 'Kaszubski Park Krajobrazowy',
            description: 'Niezliczone jeziora i morenowe wzgórza zwane "Szwajcarią Kaszubską".',
            url: 'https://kpk.pomorskie.eu/'
        },
        {
            title: 'Wieżyca – Wieża Widokowa',
            description: 'Najwyższy szczyt Niżu Polskiego (329 m n.p.m.) z widokiem na całe Kaszuby.',
            url: 'https://szwajcariakaszubska.com/atrakcje/wieza-widokowa-na-wiezycy'
        },
        {
            title: 'CEPR w Szymbarku',
            description: 'Słynny "Dom do góry nogami", Najdłuższą Deska Świata i Dom Sybiraka.',
            url: 'https://cepr.pl/'
        },
        {
            title: 'Skansen we Wdzydzach',
            description: 'Najstarsze w Polsce muzeum na wolnym powietrzu nad "Kaszubskim Morzem".',
            url: 'http://www.muzeum-wdzydze.gda.pl/'
        },
        {
            title: 'Muzeum Hymnu w Będominie',
            description: 'Jedyne na świecie muzeum poświęcone "Mazurkowi Dąbrowskiego" (bardzo blisko domków!).',
            url: 'https://muzeumhymnu.pl/'
        },
        {
            title: 'Trasy Rowerowe Nowa Karczma',
            description: 'Lokalne szlaki prowadzące przez najpiękniejsze zakątki gminy.',
            url: 'https://www.nowakarczma.pl/asp/walory-turystyczne,42,,1'
        }
    ];

    return (
        <section id="attractions" className={styles.section}>
            <div className={styles.container}>
                <h2 className={styles.title}>Atrakcje w okolicy 🌲</h2>
                <p className={styles.subtitle}>
                    Odkryj uroki Szumlesia Królewskiego i serca Kaszub. Kliknij, aby dowiedzieć się więcej.
                </p>
                
                <div className={styles.grid}>
                    {attractions.map((item, idx) => (
                        <div key={idx} className={styles.card}>
                            <div className={styles.header}>
                                <span className={styles.dot}></span>
                                <h3 className={styles.cardTitle}>{item.title}</h3>
                            </div>
                            <p className={styles.description}>{item.description}</p>
                            <a 
                                href={item.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className={styles.link}
                            >
                                Więcej &raquo;
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}