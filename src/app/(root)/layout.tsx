import Header from '@components/Header/Header';
import Footer from '@components/Footer/Footer';
import TopBar from '@components/Navbar/TopBar';
import styles from './layout.module.css';

export default async function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Header topBar={<TopBar />} />
            <div className={styles.shell}>
                <main className={styles.main}>{children}</main>
                <Footer />
            </div>
        </>
    );
}