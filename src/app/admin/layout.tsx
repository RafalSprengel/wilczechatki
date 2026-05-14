'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import AppToaster from '@/app/_components/AppToaster/AppToaster';
import styles from './admin.module.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isBookingsOpen, setIsBookingsOpen] = useState(false);
  const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isBookingsActive = pathname?.startsWith('/admin/bookings');
  const isPropertiesActive = pathname === '/admin/properties' || pathname?.startsWith('/admin/properties/');
  const isPricesActive = pathname === '/admin/prices' || pathname?.startsWith('/admin/prices/');
  const isPaymentsActive = pathname === '/admin/payments' || pathname?.startsWith('/admin/payments/');
  const isPaymentsOnlineActive = pathname === '/admin/payments/online';
  const isPaymentsOfflineActive = pathname === '/admin/payments/offline';
  const isSettingsActive = pathname === '/admin/settings';
  const isDevActive = pathname === '/admin/dev';

  const toggleBookings = () => setIsBookingsOpen(!isBookingsOpen);
  const togglePayments = () => setIsPaymentsOpen(!isPaymentsOpen);

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
    if (isPaymentsActive) {
      setIsPaymentsOpen(true);
    }
    return () => {
      document.body.classList.remove('mobile-menu-open');
    };
  }, [isBookingsActive, isPaymentsActive]);

  return (
    <>
      <AppToaster />
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
            <Link href='/admin' onClick={handleMenuLinkClick}><h2>Panel Admina</h2></Link>
          </div>

          <nav className={styles.sidebarNav}>
            <div>
              <div className={styles.navGroupTitle}>Zarządzanie</div>

              <div>
                <div
                  className={`${styles.navLink} ${isBookingsActive ? styles.active : ''}`}
                  onClick={toggleBookings}
                  style={{ justifyContent: 'space-between', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className={styles.navIcon}>📅</span>
                    <span>Rezerwacje</span>
                  </div>
                  <span>{isBookingsOpen ? '▲' : '▼'}</span>
                </div>

                <div className={`${styles.submenu} ${isBookingsOpen ? styles.open : ''}`}>
                  <Link
                    href="/admin/bookings/add"
                    className={`${styles.subLink} ${pathname === '/admin/bookings/add' ? styles.active : ''}`}
                    onClick={handleMenuLinkClick}
                  >
                    ➕ Dodaj nową
                  </Link>
                  <Link
                    href="/admin/bookings/calendar"
                    className={`${styles.subLink} ${pathname === '/admin/bookings/calendar' ? styles.active : ''}`}
                    onClick={handleMenuLinkClick}
                  >
                    🗓️ Kalendarz
                  </Link>
                  <Link
                    href="/admin/bookings/list"
                    className={`${styles.subLink} ${pathname === '/admin/bookings/list' ? styles.active : ''}`}
                    onClick={handleMenuLinkClick}
                  >
                    📋 Lista rezerwacji
                  </Link>
                  <Link
                    href="/admin/bookings/block"
                    className={`${styles.subLink} ${pathname === '/admin/bookings/block' ? styles.active : ''}`}
                    onClick={handleMenuLinkClick}
                  >
                    🚫 Blokuj terminy
                  </Link>
                </div>
              </div>

              <Link
                href="/admin/properties"
                className={`${styles.navLink} ${isPropertiesActive ? styles.active : ''}`}
                onClick={handleMenuLinkClick}
              >
                <span className={styles.navIcon}>🏠</span>
                <span>Domki</span>
              </Link>

              <Link
                href="/admin/prices"
                className={`${styles.navLink} ${isPricesActive ? styles.active : ''}`}
                onClick={handleMenuLinkClick}
              >
                <span className={styles.navIcon}>💰</span>
                <span>Ceny</span>
              </Link>

              <div>
                <div
                  className={`${styles.navLink} ${isPaymentsActive ? styles.active : ''}`}
                  onClick={togglePayments}
                  style={{ justifyContent: 'space-between', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className={styles.navIcon}>💳</span>
                    <span>Płatności</span>
                  </div>
                  <span>{isPaymentsOpen ? '▲' : '▼'}</span>
                </div>

                <div className={`${styles.submenu} ${isPaymentsOpen ? styles.open : ''}`}>
                  <Link
                    href="/admin/payments/online"
                    className={`${styles.subLink} ${isPaymentsOnlineActive ? styles.active : ''}`}
                    onClick={handleMenuLinkClick}
                  >
                    💳 Płatności online
                  </Link>
                  <Link
                    href="/admin/payments/offline"
                    className={`${styles.subLink} ${isPaymentsOfflineActive ? styles.active : ''}`}
                    onClick={handleMenuLinkClick}
                  >
                    💵 Gotówka / Przelew
                  </Link>
                </div>
              </div>
            </div>

            <div>
              <div className={styles.navGroupTitle}>Konfiguracja</div>
              <Link
                href="/admin/settings"
                className={`${styles.navLink} ${isSettingsActive ? styles.active : ''}`}
                onClick={handleMenuLinkClick}
              >
                <span className={styles.navIcon}>⚙️</span>
                Ustawienia systemu
              </Link>
              <Link
                href="/admin/settings/booking"
                className={`${styles.navLink} ${pathname === '/admin/settings/booking' ? styles.active : ''}`}
                onClick={handleMenuLinkClick}
              >
                <span className={styles.navIcon}>📅</span>
                Ustawienia rezerwacji
              </Link>
            </div>

          </nav>

          <div className={styles.sidebarFooter}>
            <Link
              href="/"
              className={`${styles.navLinkSmall} ${pathname === '/' ? styles.active : ''}`}
              onClick={handleMenuLinkClick}
            >
              <span className={styles.navIcon}>🌐</span>
              Wróć na stronę
            </Link>
            <button className={styles.btnLogout} onClick={async () => {
              await authClient.signOut();
              router.push('/admin-login');
            }}>
              Wyloguj się
            </button>
          </div>
        </aside>

        <main className={styles.adminContent}>
          {children}
        </main>
      </div>
    </>
  );
}