'use server'

import dbConnect from '@/db/connection';
import Booking from '@/db/models/Booking';
import Property from '@/db/models/Property';
import { Types } from 'mongoose';

interface GuestData {
  firstName: string;
  lastName: string;
  address: string;
  email: string;
  phone: string;
  invoice: boolean;
  invoiceData?: {
    companyName: string;
    nip: string;
    street: string;
    city: string;
    postalCode: string;
  };
  termsAccepted: boolean;
}

interface SelectedOption {
  type: 'single' | 'double';
  displayName: string;
  totalPrice: number;
  maxGuests: number;
  propertyIds?: string[];
}

interface BookingDraftData {
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  extraBeds: number;
  selectedOption: SelectedOption | null;
  guestData: GuestData;
}

export async function createBookingFromDraft(draftData: BookingDraftData) {
  try {
    await dbConnect();

    const { startDate, endDate, adults, children, extraBeds, selectedOption, guestData } = draftData;

    if (!selectedOption) {
      return { success: false, error: 'Brak wybranego obiektu' };
    }

    // Walidacja danych gościa
    if (!guestData.firstName || !guestData.lastName || !guestData.email || !guestData.phone) {
      return { success: false, error: 'Niekompletne dane gościa' };
    }

    // Oblicz całkowitą liczbę gości
    const numberOfGuests = adults + children;

    // Przygotuj dane do zapisu
    const bookings = [];

    // Sprawdź czy mamy propertyIds - jeśli nie, spróbuj je pobrać z bazy
    let propertyIds = selectedOption.propertyIds || [];
    
    // Jeśli nie ma propertyIds, spróbuj znaleźć domki po nazwie
    if (propertyIds.length === 0) {
      if (selectedOption.type === 'double') {
        // Dla całej posesji, znajdź wszystkie aktywne domki
        const properties = await Property.find({ isActive: true }).select('_id');
        propertyIds = properties.map(p => p._id.toString());
      } else {
        // Dla pojedynczego domku, spróbuj znaleźć po nazwie
        const property = await Property.findOne({ name: selectedOption.displayName }).select('_id');
        if (property) {
          propertyIds = [property._id.toString()];
        }
      }
    }

    if (propertyIds.length === 0) {
      return { success: false, error: 'Nie można znaleźć domku w bazie' };
    }

    // Dla opcji 'double' (cała posesja) tworzymy osobne rezerwacje dla każdego domku
    if (selectedOption.type === 'double') {
      // Dla całej posesji - rezerwacja dla każdego domku
      for (const propertyId of propertyIds) {
        bookings.push({
          propertyId: new Types.ObjectId(propertyId),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          guestName: `${guestData.firstName} ${guestData.lastName}`,
          guestEmail: guestData.email,
          guestPhone: guestData.phone,
          guestAddress: guestData.address,
          numberOfGuests: Math.ceil(numberOfGuests / propertyIds.length), // Równomiernie rozdziel gości
          extraBeds: Math.ceil(extraBeds / propertyIds.length), // Równomiernie rozdziel dostawki
          totalPrice: selectedOption.totalPrice / propertyIds.length, // Podziel cenę
          status: 'confirmed',
          bookingType: 'real',
          invoice: guestData.invoice,
          invoiceData: guestData.invoiceData,
          notes: `Rezerwacja całej posesji. Dzieci: ${children}`,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } else {
      // Dla pojedynczego domku
      bookings.push({
        propertyId: new Types.ObjectId(propertyIds[0]),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        guestName: `${guestData.firstName} ${guestData.lastName}`,
        guestEmail: guestData.email,
        guestPhone: guestData.phone,
        guestAddress: guestData.address,
        numberOfGuests,
        extraBeds,
        totalPrice: selectedOption.totalPrice,
        status: 'confirmed',
        bookingType: 'real',
        invoice: guestData.invoice,
        invoiceData: guestData.invoiceData,
        notes: `Dzieci: ${children}`,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    const savedBookings = await Booking.insertMany(bookings);

    return { 
      success: true, 
      message: 'Rezerwacja utworzona pomyślnie',
      bookingIds: savedBookings.map(b => b._id.toString())
    };

  } catch (error) {
    console.error('Błąd podczas tworzenia rezerwacji:', error);
    return { success: false, error: 'Nie udało się utworzyć rezerwacji' };
  }
}