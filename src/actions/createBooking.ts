'use server'
import dbConnect from '@/db/connection';
import Booking from '@/db/models/Booking';
import Property from '@/db/models/Property';
import SystemConfig from '@/db/models/SystemConfig';
import mongoose from 'mongoose';

interface CreateBookingParams {
  propertyId: string;
  startDate: string;
  endDate: string;
  guestName: string;
  guestEmail: string;
  totalPrice: number;
  paymentId: string;
  numberOfGuests?: number;
  extraBedsCount?: number;
}

export async function createBookingWithConditionalBlock({
  propertyId,
  startDate,
  endDate,
  guestName,
  guestEmail,
  totalPrice,
  paymentId,
  numberOfGuests = 0,
  extraBedsCount = 0
}: CreateBookingParams) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await dbConnect();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const selectedPropId = new mongoose.Types.ObjectId(propertyId);

    let config = await SystemConfig.findById('main').session(session);
    if (!config) {
      config = await SystemConfig.create([{
        _id: 'main',
        autoBlockOtherCabins: true
      }], { session });
      config = config[0];
    }

    const shouldAutoBlock = config.autoBlockOtherCabins;

    const mainBooking = await Booking.create([{
      propertyId: selectedPropId,
      guestName,
      guestEmail,
      startDate: start,
      endDate: end,
      totalPrice,
      numberOfGuests,
      extraBedsCount,
      status: 'confirmed',
      bookingType: 'real',
      paymentId,
    }], { session });

    const mainBookingId = mainBooking[0]._id;

    if (shouldAutoBlock) {
      const otherProperties = await Property.find({
        isActive: true,
        _id: { $ne: selectedPropId }
      }).session(session);

      if (otherProperties.length > 0) {
        const shadowBookingsData = otherProperties.map(otherProp => ({
          propertyId: otherProp._id,
          guestName: "SYSTEM BLOCK (Auto)",
          guestEmail: "system@wilczechatki.pl",
          startDate: start,
          endDate: end,
          totalPrice: 0,
          numberOfGuests: 0,
          extraBedsCount: 0,
          status: 'blocked',
          bookingType: 'shadow',
          linkedBookingId: mainBookingId,
          paymentId: null
        }));

        await Booking.create(shadowBookingsData, { session });
      }
    }

    await session.commitTransaction();

    return {
      success: true,
      bookingId: mainBookingId,
      message: shouldAutoBlock
        ? "Rezerwacja potwierdzona. Inne domki zostały automatycznie zablokowane."
        : "Rezerwacja potwierdzona."
    };
  } catch (error) {
    await session.abortTransaction();
    console.error("Błąd tworzenia rezerwacji:", error);
    return { success: false, message: "Nie udało się dokończyć rezerwacji." };
  } finally {
    session.endSession();
  }
}