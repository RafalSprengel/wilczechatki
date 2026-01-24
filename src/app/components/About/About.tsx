import styles from './About.module.css';

export default function About() {
    return (
        <section id="about-us" className={styles.section}>
            <div className={styles.wrapper}>
                <h2 className={styles.title}>Serdecznie witamy w Wilczych Chatkach!</h2>
                
                <div className={styles.content}>
                    <p>
                        Szukasz miejsca, gdzie odpoczniesz od miejskiego zgiełku, nacieszysz się ciszą i spokojem,
                        a jednocześnie będziesz blisko największych atrakcji Pomorza?
                        Nasze dwa przytulne domki w <strong>Szumlesiu Królewskim</strong>,
                        malowniczej wsi położonej między <strong>Gdańskiem a Kościerzyną</strong>,
                        to idealne miejsce na rodzinny wypoczynek, urlop w gronie przyjaciół czy romantyczny weekend we dwoje.
                    </p>
                    
                    <p>
                        Nasz obiekt położony jest w spokojnej, zielonej okolicy, która gwarantuje wytchnienie 
                        od codziennego pośpiechu i bliski kontakt z naturą. Jest to fantastyczne miejsce dla rodzin 
                        z dziećmi, miłośników wycieczek rowerowych, spacerowiczów oraz każdego, kto pragnie 
                        naładować baterie w otoczeniu kaszubskich lasów i jezior.
                    </p>

                    <p>
                        Obiekt zlokalizowany jest w miejscowości Szumleś Królewski. 
                        Dzięki tej lokalizacji nasi Goście mogą cieszyć się absolutną ciszą i prywatnością, 
                        mając jednocześnie szybki dostęp do regionalnych perełek, 
                        takich jak Kaszubski Park Krajobrazowy, szczyt Wieżyca czy słynny dom do góry nogami w Szymbarku.
                    </p>

                    <p>
                        Po dniu pełnym wrażeń, do Państwa dyspozycji oddajemy strefę relaksu z 
                        <strong> sauną infrared</strong> oraz klimatycznym <strong>jacuzzi ogrzewanym drewnem</strong>. 
                        W przypadku pytań prosimy o kontakt mailowy, telefoniczny lub poprzez formularz.
                    </p>
                </div>

                <div className={styles.links}>
                    <a href="#atrakcje" className={styles.link}>Przeczytaj więcej o atrakcjach w regionie &raquo;</a>
                </div>
            </div>
        </section>
    );
}