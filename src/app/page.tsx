import HeroSlider from "@components/Hero/HeroSlider";
import Services from "@components/Services/Services";
import Attractions from "@components/Attractions/Attractions";
import Contact from "@components/Contact/Contact";

export default function Home() {
    return (
        <main>
            <HeroSlider />
            <Services />
            <Attractions />
            <Contact />
        </main>
    );
}