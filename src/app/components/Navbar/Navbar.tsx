'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';
import Image from 'next/image';
import HamburgerButton from './HamburgerButton';

export default function Navbar({isSmaller}: {isSmaller: boolean}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const hamburgerRef = useRef<HTMLButtonElement>(null);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (
            mobileMenuRef.current &&
            !mobileMenuRef.current.contains(event.target as Node) &&
            hamburgerRef.current &&
            !hamburgerRef.current.contains(event.target as Node)
        ) {
            setIsMenuOpen(false);
        }
    };
    const closeMobileMenu = () => setIsMenuOpen(false)

    useEffect(() => {
        console.log('isMenuOpen:', isMenuOpen);
        if (isMenuOpen) {
            window.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            window.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    return (
        <nav className={styles.container+(isSmaller ? ' '+styles.smallerNavbar : '')}>
            <div className={styles.inner}>
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
                        ref={hamburgerRef}
                        isOpen={isMenuOpen}
                        onClick={toggleMenu}
                        className={styles.hamburger} />
                </div>
                <div className={styles.mobileMenuOuter + ' ' + (isMenuOpen ? styles.showMobileMenu : '')}>
                    <div className={styles.mobileMenuInner} ref={mobileMenuRef}>
                        <ul className={styles.navLinks}>
                            <li onClick={closeMobileMenu}><Link href="/">STRONA GŁÓWNA</Link></li>
                            <li onClick={closeMobileMenu}><Link href="/#services">OFERTA</Link></li>
                            <li onClick={closeMobileMenu}><Link href="/gallery">GALERIA</Link></li>
                            <li onClick={closeMobileMenu}><Link href="/#attractions">KASZUBY</Link></li>
                            <li onClick={closeMobileMenu}><Link href="/#contact">KONTAKT</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
        </nav>
    );
}