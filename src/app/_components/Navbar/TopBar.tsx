import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook } from '@fortawesome/free-brands-svg-icons';
import styles from './TopBar.module.css';

export default function TopBar() {
    return (
        <div className={styles.container}>
            <div className={styles.inner}>
                <div className={styles.contactInfo}>
                    <a href="tel:+48668388570">+48 668 388 570</a>
                    <a href="mailto:kontakt@wilczechatki.pl">kontakt@wilczechatki.pl</a>
                </div>
                <div className={styles.socialIcons}>
                    <a 
                        href="https://facebook.com/profile.php?id=61584455637648"
                        target="_blank" 
                        rel="noopener noreferrer"
                        aria-label="Facebook"
                    >
                        <FontAwesomeIcon 
                            icon={faFacebook} 
                            style={{ width: '20px', height: '20px' }} 
                        />
                    </a>
                </div>
            </div>
        </div>
    );
}