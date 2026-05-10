import dbConnect from '@/db/connection';
import SiteSettings, { ISiteSettings } from '@/db/models/SiteSettings';
import { SITE_CONFIG } from '@/config/site';

export async function ensureSiteSettingsExist() {
  await dbConnect();

  try {
    const existingSettings = await SiteSettings.findById('main');

    if (!existingSettings) {
      await SiteSettings.create({
        _id: 'main',
        ...SITE_CONFIG
      });
    }
  } catch (error) {
    console.error('Błąd podczas inicjalizacji SiteSettings:', error);
  }
}

export async function getCachedSiteSettings(): Promise<Partial<ISiteSettings>> {
  await ensureSiteSettingsExist();

  try {
    await dbConnect();
    const settings = await SiteSettings.findById('main');

    if (!settings) {
      return SITE_CONFIG;
    }

    return {
      phoneDisplay: settings.phoneDisplay,
      phoneHref: settings.phoneHref,
      email: settings.email,
      facebookUrl: settings.facebookUrl,
      bankAccountNumber: settings.bankAccountNumber,
    };
  } catch (error) {
    console.error('Błąd podczas pobierania SiteSettings:', error);
    return SITE_CONFIG;
  }
}
