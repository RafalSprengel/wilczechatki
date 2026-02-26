'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './admin.module.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isBookingsOpen, setIsBookingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isBookingsActive = pathname?.startsWith('/admin/bookings');
  const isPropertiesActive = pathname === '/admin/properties' || pathname?.startsWith('/admin/properties/');
  const isPricesActive = pathname === '/admin/prices' || pathname?.startsWith('/admin/prices/');
  const isSettingsActive = pathname === '/admin/settings';
  const isDevActive = pathname === '/admin/dev';

  const toggleBookings = () => setIsBookingsOpen(!isBookingsOpen);

  const handleMenuLinkClick = () => {
    if (isMobileMenuOpen) {
      closeMobileMenu();
    }
  };

  const openMobileMenu = () => {
    document.body.classList.add('mobile-menu-open');
    setIsMobileMenuOpen(true);
  };

  const closeMobileMenu = () => {
    document.body.classList.remove('mobile-menu-open');
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    if (isBookingsActive) {
      setIsBookingsOpen(true);
    }
    return () => {
      document.body.classList.remove('mobile-menu-open');
    };
  }, [isBookingsActive]);

  const getLinkClassName = (path: string, isActive: boolean, isSubLink: boolean = false) => {
    let className = isSubLink ? `${styles.subLink}` : `${styles.navLink}`;
    if (isActive) className += ` ${styles.active}`;
    return className;
  };

  const getStaticLinkClassName = (isActive: boolean) => {
    let className = `${styles.navLinkStatic}`;
    if (isActive) className += ` ${styles.active}`;
    return className;
  };

  return (
    <div className={styles.adminLayout}>
      <div 
        className={`${styles.mobileOverlay} ${isMobileMenuOpen ? styles.visible : ''}`}
        onClick={closeMobileMenu}
      ></div>

      <button 
        className={styles.mobileToggle} 
        onClick={openMobileMenu}
      >
        ☰ Menu
      </button>

      <aside className={`${styles.adminSidebar} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <h2>Panel Adminia</h2>
        </div>
        
        <nav className={styles.sidebarNav}>
          <div>
            <div className={styles.navGroupTitle}>Zarządzanie</div>
            
            <div>
              <div 
                className={getLinkClassName('', isBookingsActive)}
                onClick={toggleBookings}
                style={{ justifyContent: 'space-between' }}
              >
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <span className={styles.navIcon}>📅</span>
                  <span>Rezerwacje</span>
                </div>
                <span>{isBookingsOpen ? '▲' : '▼'}</span>
              </div>

              <div className={`${styles.submenu} ${isBookingsOpen ? styles.open : ''}`}>
                <Link 
                  href="/admin/bookings/add" 
                  className={getLinkClassName('/admin/bookings/add', pathname === '/admin/bookings/add', true)}
                  onClick={handleMenuLinkClick}
                >
                  ➕ Dodaj Nową
                </Link>
                <Link 
                  href="/admin/bookings/calendar" 
                  className={getLinkClassName('/admin/bookings/calendar', pathname === '/admin/bookings/calendar', true)}
                  onClick={handleMenuLinkClick}
                >
                  🗓️ Kalendarz
                </Link>
                <Link 
                  href="/admin/bookings/list" 
                  className={getLinkClassName('/admin/bookings/list', pathname === '/admin/bookings/list', true)}
                  onClick={handleMenuLinkClick}
                >
                  📋 Lista Rezerwacji
                </Link>
              </div>
            </div>

            <Link 
              href="/admin/properties" 
              className={getStaticLinkClassName(isPropertiesActive)}
              onClick={handleMenuLinkClick}
            >
              <span className={styles.navIcon}>🏠</span>
              <span>Domki</span>
            </Link>

            <Link 
              href="/admin/prices" 
              className={getStaticLinkClassName(isPricesActive)}
              onClick={handleMenuLinkClick}
            >
              <span className={styles.navIcon}>💰</span>
              <span>Ceny</span>
            </Link>
          </div>

          <div>
            <div className={styles.navGroupTitle}>Konfiguracja</div>
            <Link 
              href="/admin/settings" 
              className={getLinkClassName('/admin/settings', isSettingsActive)}
              onClick={handleMenuLinkClick}
            >
              <span className={styles.navIcon}>⚙️</span>
              Ustawienia Systemu
            </Link>
          </div>

          <div>
            <div className={styles.navGroupTitle}>Narzędzia</div>
            <Link 
              href="/admin/dev" 
              className={getLinkClassName('/admin/dev', isDevActive)}
              onClick={handleMenuLinkClick}
            >
              <span className={styles.navIcon}>💻</span>
              Dev / Debug
            </Link>
          </div>
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.navLink} style={{marginBottom: '10px'}} onClick={handleMenuLinkClick}>
            <span className={styles.navIcon}>🏠</span>
            Wróć na stronę
          </Link>
          <button className={styles.btnLogout} onClick={() => alert('Wylogowanie (do implementacji)')}>
            Wyloguj się
          </button>
        </div>
      </aside>

      <main className={styles.adminContent}>
        {children}
      </main>
    </div>
  );
}