'use client'
import { useState, useEffect, ReactNode } from 'react';
import Navbar from '@components/Navbar/Navbar';
import styles from './Header.module.css';

export default function Header({ topBar }: { topBar: ReactNode }) {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const scrollY = () => {
            if (window.scrollY > 100) {
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
            {topBar}
            <Navbar isSmaller={isScrolled} />
        </header>
    )
}