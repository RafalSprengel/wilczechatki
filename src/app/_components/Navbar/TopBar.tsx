import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook } from '@fortawesome/free-brands-svg-icons';
import styles from './TopBar.module.css';
import { getSiteSettings } from '@/actions/siteSettingsActions';

export default async function TopBar() {
    const siteSettings = await getSiteSettings();

    return (
        <div className={styles.container}>
            <div className={styles.inner}>
                <div className={styles.contactInfo}>
                    <a href={`tel:${siteSettings.phoneHref}`}>{siteSettings.phoneDisplay}</a>
                    <a href={`mailto:${siteSettings.email}`}>{siteSettings.email}</a>
                </div>
                <div className={styles.socialIcons}>
                    <a
                        href={siteSettings.facebookUrl}
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