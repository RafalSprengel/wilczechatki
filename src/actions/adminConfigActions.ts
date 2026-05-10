'use server'

import dbConnect from '@/db/connection';
import SystemConfig, { ISystemConfig } from '@/db/models/SystemConfig';
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
      };
    }

    return {
      autoBlockOtherCabins: config.autoBlockOtherCabins,
    };
  } catch (error) {
    console.error(error);
    return {
      autoBlockOtherCabins: true,
    };
  }
}

export async function updateSystemConfigSetting(
  settingKey: keyof ISystemConfig,
  value: boolean,
  pathsToRevalidate: string[] = ['/admin/settings', '/booking']
): Promise<{ success: boolean; currentValue?: boolean; message: string }> {
  try {
    await dbConnect();
    const config = await SystemConfig.findByIdAndUpdate(
      'main',
      { [settingKey]: value },
      { upsert: true, new: true, runValidators: true }
    );

    // Revalidate specified paths
    pathsToRevalidate.forEach(path => revalidatePath(path));

    return {
      success: true,
      currentValue: config[settingKey as keyof typeof config],
      message: value ? "Włączono." : "Wyłączono."
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Błąd zapisu." };
  }
}