'use server'

import dbConnect from '@/db/connection';
import SystemConfig from '@/db/models/SystemConfig';
import { revalidatePath } from 'next/cache';

async function ensureSystemConfigExists() {
  await dbConnect();

  const defaultConfig = {
    _id: 'main',
    autoBlockOtherCabins: true,
  };

  try {
    const existingConfig = await SystemConfig.findById('main');

    if (!existingConfig) {
      await SystemConfig.create(defaultConfig);
      return;
    }

    let needsUpdate = false;
    const updates: any = {};

    if (typeof existingConfig.autoBlockOtherCabins !== 'boolean') {
      updates.autoBlockOtherCabins = defaultConfig.autoBlockOtherCabins;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await SystemConfig.findByIdAndUpdate('main', updates, { runValidators: false });
    }

  } catch (error) {
    console.error(error);
  }
}

export async function getSystemConfig() {
  await ensureSystemConfigExists();

  try {
    await dbConnect();
    const config = await SystemConfig.findById('main');
    
    if (!config) {
      return {
        autoBlockOtherCabins: true,
        onlyOnePropertyInSearchResult: false
      };
    }

    return {
      autoBlockOtherCabins: config.autoBlockOtherCabins,
      onlyOnePropertyInSearchResult: config.onlyOnePropertyInSearchResult
    };
  } catch (error) {
    console.error(error);
    return {
      autoBlockOtherCabins: true
    };
  }
}

export async function updateAutoBlockSetting(enabled: boolean): Promise<{ success: boolean; currentValue?: boolean; message: string }> {
  try {
    await dbConnect();
    const config = await SystemConfig.findByIdAndUpdate(
      'main',
      { autoBlockOtherCabins: enabled },
      { upsert: true, new: true, runValidators: true }
    );
    revalidatePath('/admin/settings');
    return { 
      success: true, 
      currentValue: config.autoBlockOtherCabins,
      message: enabled ? "Włączono blokadę." : "Wyłączono blokadę."
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Błąd zapisu." };
  }
}