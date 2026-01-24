'use client'
import { useState, useEffect, use } from 'react';
import TopBar from '@components/Navbar/TopBar';
import Navbar from '@components/Navbar/Navbar';
import styles from './Header.module.css';

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const scrollY = () => {
            if (window.scrollY > 0) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        }
        window.addEventListener('scroll', scrollY);
        return ()=> window.removeEventListener('scroll', scrollY);
    }, [])

    return (
        <header className={styles.container + (isScrolled ? ' ' + styles.scrolled : '')}>
            <TopBar />
            <Navbar />
        </header>

    )

}