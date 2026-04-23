async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
  }

  const { resolveOccupiedPropertyIdsFromBookings } = await import(
    '@/utils/lazyAvailabilityCleanup'
  );

  const now = Date.now();

  const sampleBookings = [
    {
      _id: 'b1',
      propertyId: 'p-blocked',
      status: 'blocked',
      createdAt: new Date(now - 5 * 60 * 1000).toISOString(),
      source: 'admin',
      adminNotes: '',
    },
    {
      _id: 'b2',
      propertyId: 'p-confirmed',
      status: 'confirmed',
      createdAt: new Date(now - 5 * 60 * 1000).toISOString(),
      source: 'online',
      adminNotes: '',
    },
    {
      _id: 'b3',
      propertyId: 'p-pending-fresh',
      status: 'pending',
      createdAt: new Date(now - 2 * 60 * 1000).toISOString(),
      source: 'online',
      adminNotes: '',
    },
    {
      _id: 'b4',
      propertyId: 'p-cancelled',
      status: 'cancelled',
      createdAt: new Date(now - 2 * 60 * 1000).toISOString(),
      source: 'online',
      adminNotes: '',
    },
  ];

  const { occupiedPropertyIds, didMutateBookings } =
    await resolveOccupiedPropertyIdsFromBookings(sampleBookings);

  const actual = Array.from(occupiedPropertyIds).sort();
  const expected = ['p-blocked', 'p-confirmed', 'p-pending-fresh'].sort();

  const sameLength = actual.length === expected.length;
  const sameValues = expected.every((value, index) => actual[index] === value);

  if (!sameLength || !sameValues) {
    throw new Error(
      `Unexpected occupied IDs. Expected: ${expected.join(', ')} | Actual: ${actual.join(', ')}`
    );
  }

  if (didMutateBookings) {
    throw new Error('Expected didMutateBookings=false for fresh pending bookings.');
  }

  console.log('lazyCleanupSmokeTest: OK');
  console.log(`occupied: ${actual.join(', ')}`);
  console.log(`didMutateBookings: ${didMutateBookings}`);
}

main().catch((error) => {
  console.error('lazyCleanupSmokeTest: FAILED');
  console.error(error);
  process.exit(1);
});