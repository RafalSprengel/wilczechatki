import dbConnect from '@/db/connection';
import Season from '@/db/models/Season';

export async function hasSeasonOverlap(
  startDate: Date,
  endDate: Date,
  excludeSeasonId?: string
): Promise<{ hasOverlap: boolean; overlappingSeason?: Record<string, unknown> }> {
  await dbConnect();

  const query: any = {
    isActive: true,
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
    ]
  };

  if (excludeSeasonId) {
    query._id = { $ne: excludeSeasonId };
  }

  const overlapping = await Season.findOne(query).lean();

  if (overlapping) {
    return {
      hasOverlap: true,
      overlappingSeason: {
        _id: overlapping._id.toString(),
        name: overlapping.name,
        startDate: overlapping.startDate,
        endDate: overlapping.endDate
      }
    };
  }

  return { hasOverlap: false };
}