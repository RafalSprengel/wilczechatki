import styles from './About.module.css';

export default function About() {
    return (
        <section id="about-us" className={styles.section}>
            <div className={styles.wrapper}>
                <h2 className={styles.title}>Serdecznie witamy w Wilczych Chatkach!</h2>
                
                <div className={styles.content}>
                    <p>
                        Jeżeli szukacie Państwo miejsca na wymarzony urlop, rodzinne wakacje czy spontaniczny 
                        weekendowy wypad na Kaszuby – doskonale trafiliście! <strong>Wilcze Chatki</strong> to dwa 
                        nowoczesne, całoroczne domki bliźniacze, które łączą bieszczadzki klimat z malowniczym 
                        krajobrazem Szumlesia Królewskiego.
                    </p>
                    
                    <p>
                        Nasz obiekt położony jest w spokojnej, zielonej okolicy, która gwarantuje wytchnienie 
                        od miejskiego zgiełku i bliski kontakt z naturą. Jest to fantastyczne miejsce dla rodzin 
                        z dziećmi, miłośników wycieczek rowerowych, spacerowiczów oraz każdego, kto pragnie 
                        naładować baterie w otoczeniu lasów i jezior.
                    </p>

                    <p>
                        Obiekt zlokalizowany jest w miejscowości <strong>Szumles Królewski</strong>, położonej dogodnie 
                        między Gdańskiem a Kościerzyną. Dzięki tej lokalizacji nasi Goście mogą cieszyć się 
                        absolutną ciszą i prywatnością, mając jednocześnie szybki dostęp do atrakcji regionu, 
                        takich jak Kaszubski Park Krajobrazowy, szczyt Wieżyca czy słynny Szymbark.
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