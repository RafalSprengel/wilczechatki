import HeroSlider from "@components/Hero/HeroSlider";
import About from "@components/About/About";
import Services from "@components/Services/Services";
import GallerySection from "@/app/_components/GallerySection/GallerySection";
import Attractions from "@components/Attractions/Attractions";
import Contact from "@components/Contact/Contact";
import styles from "./page.module.css";

import { getSiteSettings } from "@/actions/siteSettingsActions";

export default async function Home() {
    const siteSettings = await getSiteSettings();
    return (
        <div className={styles.main}>
            <HeroSlider />
            <About />
            <Services />
            <GallerySection />
            <Attractions />
            <Contact siteSettings={siteSettings} />
        </div>
    );
}