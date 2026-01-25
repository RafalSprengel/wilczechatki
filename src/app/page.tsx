import HeroSlider from "@components/Hero/HeroSlider";
import About from "@components/About/About";
import Services from "@components/Services/Services";
import Attractions from "@components/Attractions/Attractions";
import Contact from "@components/Contact/Contact";
import styles from "./page.module.css";

export default function Home() {
    return (
        <main className={styles.main}>
            <HeroSlider />
            <About />
            <Services />
            <Attractions />
            <Contact />
        </main>
    );
}