'use server'

import dbConnect from '@/db/connection';
import SiteSettings, { ISiteSettings } from '@/db/models/SiteSettings';
import { revalidatePath } from 'next/cache';

export async function getSiteSettings(): Promise<Partial<ISiteSettings>> {
  try {
    await dbConnect();
    const settings = await SiteSettings.findById('main').lean();

    if (!settings) {
      return {};
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
    return {};
  }
}

export async function updateSiteSettings(
  values: Partial<ISiteSettings>
): Promise<{ success: boolean; message: string }> {
  try {
    // 2. Filtrowanie pól (whitelist)
    const allowedFields: (keyof ISiteSettings)[] = [
      'phoneDisplay',
      'phoneHref',
      'email',
      'facebookUrl',
      'bankAccountNumber'
    ];

    const filteredValues: Partial<ISiteSettings> = {};
    for (const key of allowedFields) {
      if (values[key] !== undefined) {
        filteredValues[key] = values[key] as any;
      }
    }

    await dbConnect();
    await SiteSettings.findByIdAndUpdate(
      'main',
      { $set: filteredValues },
      { upsert: true, new: true, runValidators: true }
    );

    // 4. Optymalizacja RevalidatePath
    revalidatePath('/', 'layout');

    return {
      success: true,
      message: "Ustawienia strony zostały zaktualizowane."
    };
  } catch (error: any) {
    console.error('Błąd podczas aktualizacji SiteSettings:', error);

    // 5. Obsługa błędów walidacji
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return { 
        success: false, 
        message: `Błąd walidacji: ${messages.join(', ')}` 
      };
    }

    return { success: false, message: "Wystąpił błąd podczas zapisywania zmian." };
  }
}
