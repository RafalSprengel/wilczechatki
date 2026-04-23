import dbConnect from '@/db/connection';
import SystemConfig from '@/db/models/SystemConfig';

export async function generateOrderId(): Promise<string> {
  await dbConnect();

  const updated = await SystemConfig.collection.findOneAndUpdate(
    { _id: 'main' },
    {
      $inc: { lastOrderNumber: 1 },
      $setOnInsert: {
        autoBlockOtherCabins: true,
      },
    },
    {
      upsert: true,
      returnDocument: 'after',
      projection: { lastOrderNumber: 1 },
    }
  );

  if (!updated || typeof updated.lastOrderNumber === 'undefined') {
    throw new Error('Nie udało się wygenerować numeru zamówienia.');
  }

  const lastOrderNumber = Number(updated.lastOrderNumber);

  if (!Number.isInteger(lastOrderNumber) || lastOrderNumber <= 0) {
    throw new Error('Nie udało się wygenerować numeru zamówienia.');
  }

  const paddedNumber = String(lastOrderNumber).padStart(6, '0');
  return `ORD-${paddedNumber}`;
}
