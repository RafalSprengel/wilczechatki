import { getSiteSettings } from '@/actions/siteSettingsActions';
import { siteSettingsDefaults } from '@/lib/siteSettingsDefaults';
import BookingCancelClient from './BookingCancelClient';

export default async function BookingCancelPage() {
  const siteSettings = {
    ...siteSettingsDefaults,
    ...(await getSiteSettings()),
  };

  return <BookingCancelClient siteSettings={siteSettings} />;
}