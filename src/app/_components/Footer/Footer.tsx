import styles from './Footer.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone } from '@fortawesome/free-solid-svg-icons';
import { faFacebook } from '@fortawesome/free-brands-svg-icons';
import Image from 'next/image';
import { getSiteSettings } from '@/actions/siteSettingsActions';

export default async function Footer() {
  const siteSettings = await getSiteSettings();

  return (
    <footer className={styles.container}>
      <div className={styles.inner}>
        <div className={styles.info}>
          <Image
            src="/assets/logo-round.png"
            alt="Logo Wilcze Chatki"
            width={100}
            height={100}
          />
          <h3>Wilcze Chatki</h3>
          <p>83-424 Szumleś Królewski 9A</p>
          <p>Kaszuby, woj. pomorskie</p>

          <div className={styles.contact}>
            <p>
              <FontAwesomeIcon icon={faPhone} color={'#c9b363'} />
              <a href={`tel:${siteSettings.phoneHref}`} className={styles.footerContactLink}>{siteSettings.phoneDisplay}</a>
            </p>
            {/* <p>
              <FontAwesomeIcon icon={faEnvelope} /> kontakt@wilczechatki.pl
            </p> 
            */}
          </div>
        </div>

        <div className={styles.social}>
          <a
            href={siteSettings.facebookUrl}
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
        <p><a href='admin' className={styles.creatorLink}>Admin</a></p>
        <p>&copy; {new Date().getFullYear()} Wilcze Chatki. Wszelkie prawa zastrzeżone.</p>
        <div className={styles.creator}>
          Realizacja strony: &nbsp;
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