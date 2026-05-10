import { getSiteSettings } from '@/actions/siteSettingsActions';
import { siteSettingsDefaults } from '@/lib/siteSettingsDefaults';
import BookingFailClient from './BookingFailClient';

export default async function BookingFailPage() {
  const siteSettings = {
    ...siteSettingsDefaults,
    ...(await getSiteSettings()),
  };

  return <BookingFailClient siteSettings={siteSettings} />;
}