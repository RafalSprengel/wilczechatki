import styles from './Footer.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faFacebook } from '@fortawesome/free-brands-svg-icons';   
import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className={styles.container}>
      <div className={styles.inner}>
        <div className={styles.info}>
          <Image src="/assets/logo-round.png" alt="Logo Wilcze Chatki" width={100} height={100} />
          <h3>Wilcze Chatki</h3>
          <p>Szumleś Królewski, Kaszuby</p>
          <div className={styles.contact}>
            <p>
              <FontAwesomeIcon icon={faPhone} /> +48 668 388 570
            </p>
            <p>
              <FontAwesomeIcon icon={faEnvelope} /> kontakt@wilczechatki.pl
            </p>
          </div>
        </div>

        <div className={styles.social}>
          <a
            href="https://facebook.com/profile.php?id=61584455637648"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className={styles.facebook}
          >
            <FontAwesomeIcon icon={faFacebook} />
          </a>
        </div>
      </div>

      <div className={styles.copyright}>
        <p>&copy; {new Date().getFullYear()} Wilcze Chatki. Wszelkie prawa zastrzeżone.</p>
        <div className={styles.creator}>
          Realizacja strony: 
          <a 
            href="https://rafalsprengel.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.creatorLink}
          >
            Rafał Sprengel
          </a>
        </div>
      </div>
    </footer>
  );
}