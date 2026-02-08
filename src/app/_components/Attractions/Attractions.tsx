import styles from './Attractions.module.css';

export default function Attractions() {
    const attractions = [
        {
            title: 'Trasy Rowerowe Nowa Karczma',
            description: 'Lokalne szlaki prowadzące przez najpiękniejsze zakątki gminy.',
            distance: 'ok. 4 km',
            url: 'https://www.nowakarczma.pl/asp/walory-turystyczne,42,,1'
        },
        {
            title: 'Muzeum Hymnu w Będominie',
            description: 'Jedyne na świecie muzeum poświęcone "Mazurkowi Dąbrowskiego".',
            distance: 'ok. 5 km',
            url: 'https://muzeumhymnu.pl/'
        },
        {
            title: 'Stok narciarski Trzepowo',
            description: 'Wyciągi narciarskie, trasy dla początkujących oraz snowtubing.',
            distance: 'ok. 5 km',
            url: 'https://nartykaszuby.pl/'
        },
        {
            title: 'Farma Strusi w Garczynie',
            description: 'Najstarsza w Polsce hodowla strusi afrykańskich. Możliwość zwiedzania.',
            distance: 'ok. 19 km',
            url: 'http://www.strusie-garczyn.pl/'
        },
        {
            title: 'Dom do góry nogami w Szymbarku',
            description: 'Centrum Edukacji i Promocji Regionu (CEPR) ze słynnym Domem do góry nogami, Najdłuższą Deską Świata i Domem Sybiraka.',
            distance: 'ok. 20 km',
            url: 'https://cepr.pl/'
        },
        {
            title: 'Basen Aqua Centrum',
            description: 'Nowoczesny park wodny w Kościerzynie z basenami i strefą saun.',
            distance: 'ok. 20 km',
            url: 'https://basenac.pl/'
        },
        {
            title: 'Wieżyca – Wieża Widokowa',
            description: 'Najwyższy szczyt Niżu Polskiego (329 m n.p.m.) z niesamowitym widokiem.',
            distance: 'ok. 24 km',
            url: 'https://szwajcariakaszubska.com/atrakcje/wieza-widokowa-na-wiezycy'
        },
        {
            title: 'Stok narciarski Wieżyca',
            description: 'Największy ośrodek narciarski na Kaszubach (Koszałkowo).',
            distance: 'ok. 25 km',
            url: 'https://www.wiezyca.pl/'
        },
        {
            title: 'Skansen we Wdzydzach',
            description: 'Najstarsze w Polsce muzeum na wolnym powietrzu nad "Kaszubskim Morzem".',
            distance: 'ok. 30 km',
            url: 'http://www.muzeum-wdzydze.gda.pl/'
        },
        {
            title: 'Kaszubski Park Krajobrazowy',
            description: 'Niezliczone jeziora i morenowe wzgórza zwane "Szwajcarią Kaszubską".',
            distance: 'ok. 33 km',
            url: 'https://kpk.pomorskie.eu/'
        }
    ];
    return (
        <section id="attractions" className={styles.section}>
            <div className={styles.container}>
                <h2 className={styles.title}>Atrakcje w okolicy</h2>
                <p className={styles.subtitle}>
                    Odkryj uroki Szumlesia Królewskiego i serca Kaszub.
                </p>

                <div className={styles.grid}>
                    {attractions.map((item, idx) => (
                        <div key={idx} className={styles.card}>
                            <div className={styles.header}>
                                <span className={styles.dot}></span>
                                <p className={styles.cardTitle}>{item.title}</p>
                            </div>
                            <p className={styles.description}>{item.description}</p>
                            <p className={styles.distanceInfo}>Odległość: {item.distance}</p>
                            <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.link}
                            >
                                Dowiedz się więcej &raquo;
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}