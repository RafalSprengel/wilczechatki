'use server'

import dbConnect from '@/db/connection';
import SiteSettings, { ISiteSettings } from '@/db/models/SiteSettings';
import { revalidatePath } from 'next/cache';
import { getCachedSiteSettings } from '@/db/services/siteSettingsService';

export async function getSiteSettings() {
  return getCachedSiteSettings();
}

export async function updateSiteSettings(
  values: Partial<ISiteSettings>
): Promise<{ success: boolean; message: string }> {
  try {
    await dbConnect();
    await SiteSettings.findByIdAndUpdate(
      'main',
      { $set: values },
      { upsert: true, new: true, runValidators: true }
    );

    revalidatePath('/admin/settings');
    revalidatePath('/');
    revalidatePath('/contact');

    return {
      success: true,
      message: "Ustawienia strony zostały zaktualizowane."
    };
  } catch (error) {
    console.error('Błąd podczas aktualizacji SiteSettings:', error);
    return { success: false, message: "Wystąpił błąd podczas zapisywania zmian." };
  }
}
