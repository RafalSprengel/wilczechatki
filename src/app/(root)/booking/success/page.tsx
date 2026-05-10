import { getSiteSettings } from '@/actions/siteSettingsActions';
import { siteSettingsDefaults } from '@/lib/siteSettingsDefaults';
import BookingSuccessClient from './BookingSuccessClient';

export default async function BookingSuccessPage() {
  const siteSettings = {
    ...siteSettingsDefaults,
    ...(await getSiteSettings()),
  };

  return <BookingSuccessClient siteSettings={siteSettings} />;
}
