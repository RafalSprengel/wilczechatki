'use client';

import Link from 'next/link';
import styles from './Navbar.module.css';
import Image from 'next/image';

export default function Navbar() {
    return (
        <nav className={styles.navbar}>
            <div className={styles.container}>
                    <Link className={styles.logoWrapper} href="/">
                    <Image
                    src="/assets/logo.webp" alt="logo"
                    fill
                    priority
                    className={styles.logoImage}
                    /></Link>
                <ul className={styles.navLinks}>
                    <li><Link href="#services">OFERTA</Link></li>
                    <li><Link href="/gallery">GALERIA</Link></li>
                    <li><Link href="#attractions">KASZUBY</Link></li>
                    <li><Link href="#contact">KONTAKT</Link></li>
                </ul>
            </div>
        </nav>
    );
}