'use server'

import dbConnect from '@/db/connection'
import Property from '@/db/models/Property'
import PropertyPrices from '@/db/models/PropertyPrices'
import CustomPrice from '@/db/models/CustomPrice'
import { revalidatePath } from 'next/cache'
import { Types } from 'mongoose'
import { DEFAULT_FALLBACK_PRICES } from '@/utils/priceDefaults'

export interface PropertyType {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  images: string[];
  maxAdults: number;
  maxChildren: number;
  maxExtraBeds: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getAllProperties(): Promise<PropertyType[]> {
  await dbConnect();
  const properties = await Property.find({})
    .sort({ name: 1 })
    .select('-__v')
    .lean();
  
  return properties.map((prop: any) => ({
    ...prop,
    _id: prop._id.toString(), // 🔥 Upewnij się że _id jest stringiem
    createdAt: prop.createdAt?.toISOString(),
    updatedAt: prop.updatedAt?.toISOString(),
  }));
}

export async function getPropertyById(id: string): Promise<PropertyType | null> {
  await dbConnect();
  
  if (!Types.ObjectId.isValid(id)) return null;

  const property = await Property.findById(id)
    .select('-__v')
    .lean();

  if (!property) return null;

  return {
    ...property,
    _id: property._id?.toString(),
    createdAt: property.createdAt?.toISOString(),
    updatedAt: property.updatedAt?.toISOString(),
  } as PropertyType;
}

export async function createProperty(formData: FormData) {
  await dbConnect();
  
  try {
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const description = formData.get('description') as string;
    const imagesString = formData.get('images') as string;
    const images = imagesString ? imagesString.split(',').map(s => s.trim()).filter(Boolean) : [];
    const maxAdults = parseInt(formData.get('maxAdults') as string, 10) || 4;
    const maxChildren = parseInt(formData.get('maxChildren') as string, 10) || 4;
    const maxExtraBeds = parseInt(formData.get('maxExtraBeds') as string, 10) || 2;

    const property = await Property.create({
      name,
      slug: slug || undefined,
      description,
      maxAdults,
      maxChildren,
      maxExtraBeds,
      images,
      isActive: true
    });

    await PropertyPrices.findOneAndUpdate(
      { propertyId: property._id, seasonId: null },
      {
        weekdayPrices: DEFAULT_FALLBACK_PRICES.weekdayPrices,
        weekendPrices: DEFAULT_FALLBACK_PRICES.weekendPrices,
        weekdayExtraBedPrice: DEFAULT_FALLBACK_PRICES.weekdayExtraBedPrice,
        weekendExtraBedPrice: DEFAULT_FALLBACK_PRICES.weekendExtraBedPrice,
      },
      { upsert: true, new: true }
    );

    revalidatePath('/admin/properties');
    revalidatePath('/admin/prices');
    return { success: true, message: 'Obiekt dodany pomyślnie', propertyId: property._id.toString() };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Nie udało się dodać domku' };
  }
}

export async function updateProperty(id: string, formData: FormData) {
  await dbConnect();
  
  try {
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const description = formData.get('description') as string;
    const imagesString = formData.get('images') as string;
    const images = imagesString ? imagesString.split(',').map(s => s.trim()).filter(Boolean) : [];
    const isActive = formData.get('isActive') === 'true';
    const maxAdults = parseInt(formData.get('maxAdults') as string, 10) || 4;
    const maxChildren = parseInt(formData.get('maxChildren') as string, 10) || 4;
    const maxExtraBeds = parseInt(formData.get('maxExtraBeds') as string, 10) || 2;

    await Property.findByIdAndUpdate(id, {
      name,
      slug: slug || undefined,
      description,
      maxAdults,
      maxChildren,
      maxExtraBeds,
      images,
      isActive
    });

    revalidatePath('/admin/properties');
    revalidatePath(`/admin/properties/${id}`);
    return { success: true, message: 'Zmiany zapisane' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Nie udało się zaktualizować domku' };
  }
}

export async function togglePropertyActive(id: string, isActive: boolean) {
  await dbConnect();
  await Property.findByIdAndUpdate(id, { isActive });
  revalidatePath('/admin/properties');
  return { success: true };
}

export async function deleteProperty(id: string) {
  await dbConnect();
  
  const BookingModule = await import('@/db/models/Booking');
  const Booking = BookingModule.default;
  
  const existingBookings = await Booking.findOne({ propertyId: id });
  
  if (existingBookings) {
    return { success: false, message: 'Nie można usunąć domku z istniejącymi rezerwacjami' };
  }

  await PropertyPrices.deleteMany({ propertyId: id });
  await CustomPrice.deleteMany({ propertyId: id });
  await Property.findByIdAndDelete(id);
  revalidatePath('/admin/properties');
  revalidatePath('/admin/prices');
  return { success: true, message: 'Obiekt usunięty' };
}