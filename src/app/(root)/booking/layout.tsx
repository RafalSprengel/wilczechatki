import Header from '@components/Header/Header';
import Footer from '@components/Footer/Footer';
import BookingStepper from './BookingStepper';

export default function BookingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Header />
            <BookingStepper />
            <main>{children}</main>
            <Footer />
        </>
    );
}