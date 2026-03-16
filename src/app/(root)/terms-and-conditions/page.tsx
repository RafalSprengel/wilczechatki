import { getBookingConfig } from '@/actions/bookingConfigActions';
import BackButton from './BackButton';
import styles from './page.module.css';

export default async function TermsAndConditionsPage() {
  const config = await getBookingConfig();
  const { checkInHour, checkOutHour } = config;

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <h1 className={styles.title}>
          Regulamin Wilczych Chatek <span className={styles.emoji}>🌲</span>
        </h1>
        <p className={styles.lead}>
          Najważniejsze: dobrze się bawcie i porządnie odpoczywajcie! To Wasz czas{' '}
          <span className={styles.emoji}>🌿</span>
        </p>

        <ul className={styles.list}>
          <li>
            <strong>Doba trwa</strong> od <span className={styles.highlight}>{checkInHour}:00</span> w dniu przyjazdu do{' '}
            <span className={styles.highlight}>{checkOutHour}:00</span> w dniu wyjazdu.
          </li>
          <li>
            W godzinach <span className={styles.highlight}>22:00 – 6:00</span> obowiązuje cisza nocna – las też chce spać{' '}
            <span className={styles.emoji}>🌙</span>
          </li>
          <li>
            W domku przebywa <strong>tylko tyle osób</strong>, ile zostało zgłoszone przy rezerwacji.
          </li>
          <li>
            Jeśli coś się uszkodzi – <strong>dajcie znać</strong>. Za szkody powstałe podczas pobytu odpowiadają Goście.
          </li>
          <li>
            <strong>Zostawcie po sobie porządek</strong> – kolejna wilcza ekipa też chce wejść z uśmiechem{' '}
            <span className={styles.emoji}>🙂</span>
          </li>
          <li className={styles.pets}>
            <span className={styles.petsIcon}>🐾</span> Zwierzęta są mile widziane! Prosimy tylko o opiekę nad nimi i
            sprzątanie po swoich pupilach.
          </li>
          <li>
            <strong>Nie odpowiadamy</strong> za rzeczy pozostawione w domkach.
          </li>
        </ul>

        <div className={styles.footer}>
          <p>Dziękujemy za szacunek do miejsca i natury <span className={styles.emoji}>🌲</span></p>
          <p className={styles.signature}>
            Miłego pobytu w Wilczych Chatkach! <span className={styles.emoji}>🐺✨</span>
          </p>
        </div>

        <BackButton />
      </div>
    </div>
  );
}