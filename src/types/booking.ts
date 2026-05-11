export interface InvoiceData {
  companyName: string;
  nip: string;
  street: string;
  city: string;
  postalCode: string;
}

export interface ClientData {
  firstName: string;
  lastName: string;
  address: string;
  email: string;
  phone: string;
}

export interface BookingOrderItem {
  propertyId: string;
  displayName: string;
  guests: number;
  adults: number;
  children: number;
  extraBeds: number;
  price: number;
}

export interface BookingData {
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  clientData: ClientData;
  invoiceData: InvoiceData;
  orders: BookingOrderItem[];
  reservationId?: string;
}

