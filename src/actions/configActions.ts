'use server'
import dbConnect from '@/db/connection';
import Property from '@/db/models/Property';

export async function getMaxTotalGuests() {
  try {
    await dbConnect();
    const properties = await Property.find({ isActive: true, type: 'single' });
    const totalCapacity = properties.reduce((sum, prop) => sum + prop.baseCapacity, 0);
    return totalCapacity;
  } catch (error) {
    console.error('Błąd podczas pobierania maksymalnej pojemności:', error);
    return 12;
  }
}