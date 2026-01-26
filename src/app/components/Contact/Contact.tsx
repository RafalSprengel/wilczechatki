
import styles from './Contact.module.css';
import ContactForm from './ContactForm';

export default function Contact() {
  
  return (
    <section id="contact" className={styles.section}>
      <div className={styles.mainContainer}>
        <h2 className={styles.title}>Kontakt</h2>
        <div className={styles.flexWrapper}>
          <div className={styles.infoColumn}>
            <div className={styles.details}>
              <p><strong>Wilcze Chatki</strong></p>
              <p>Szumleś Królewski, Kaszuby</p>
              <p>Tel: +48 668 388 570</p>
              <p>Email: kontakt@wilczechatki.pl</p>
            </div>
            <div className={styles.payment}>
              <h3>Dane do przelewu:</h3>
              <p>Numer konta (PKO BP):</p>
              <p>20 1020 5226 0000 6702 0486 0336</p>
            </div>
          </div>

          <div className={styles.formColumn}>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}