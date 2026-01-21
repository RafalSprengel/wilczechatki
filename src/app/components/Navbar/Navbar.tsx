'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';
import Image from 'next/image';
import HamburgerButton from './HamburgerButton';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.container}>
                <Link className={styles.logoWrapper} href="/">
                    <Image
                        src="/assets/logo.webp" alt="logo"
                        fill
                        priority
                        className={styles.logoImage}
                    />
                </Link>
                <div className={styles.hamburgerContainer}>
                    <HamburgerButton
                        isOpen={isMenuOpen}
                        onClick={toggleMenu}
                        className={styles.hamburger} />
                </div>
                <div className={styles.mobileMenuOuter + ' ' + (isMenuOpen ? styles.showMobileMenu : '')}>
                    <div className={styles.mobileMenuInner}>
                        <ul className={`${styles.navLinks} ${isMenuOpen ? styles.showMenu : ''}`}>
                            <li><Link href="#about-us">O nas</Link></li>
                            <li><Link href="#services">OFERTA</Link></li>
                            <li><Link href="/gallery">GALERIA</Link></li>
                            <li><Link href="#attractions">KASZUBY</Link></li>
                            <li><Link href="#contact">KONTAKT</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
        </nav>
    );
}