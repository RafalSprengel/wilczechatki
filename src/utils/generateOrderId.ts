import dbConnect from '@/db/connection';
import SystemConfig from '@/db/models/SystemConfig';

export async function generateOrderId(): Promise<string> {
  await dbConnect();

  const updated = await SystemConfig.findByIdAndUpdate(
    'main',
    { $inc: { lastOrderNumber: 1 } },
    { new: true, upsert: true }
  )
    .select('lastOrderNumber')
    .lean();

  if (!updated || typeof updated.lastOrderNumber !== 'number') {
    throw new Error('Nie udało się wygenerować numeru zamówienia.');
  }

  const paddedNumber = String(updated.lastOrderNumber).padStart(6, '0');
  return `ORD-${paddedNumber}`;
}
