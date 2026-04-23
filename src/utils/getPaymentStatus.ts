import type { PaymentStatus } from '@/types/bookingStatus';

export function calculatePaymentStatus(totalPrice: number, paidAmount: number): PaymentStatus {
  if (paidAmount >= totalPrice) return 'paid';
  if (paidAmount > 0) return 'partial_paid';
  return 'unpaid';
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case 'paid': return 'Opłacone';
    case 'partial_paid': return 'Częściowo opłacone';
    case 'refunded': return 'Zwrócone';
    case 'unpaid': return 'Nieopłacone';
    default: return 'Nieznany';
  }
}

export function getPaymentStatusClass(status: PaymentStatus): string {
  switch (status) {
    case 'paid': return 'paymentPaid';
    case 'partial_paid': return 'paymentDeposit';
    case 'refunded': return 'paymentRefunded';
    case 'unpaid': return 'paymentUnpaid';
    default: return '';
  }
}