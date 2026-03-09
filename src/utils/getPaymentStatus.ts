export type PaymentStatus = 'unpaid' | 'deposit' | 'paid';

export function calculatePaymentStatus(totalPrice: number, paidAmount: number): PaymentStatus {
  if (paidAmount >= totalPrice) return 'paid';
  if (paidAmount > 0) return 'deposit';
  return 'unpaid';
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case 'paid': return 'Opłacone';
    case 'deposit': return 'Zaliczka';
    case 'unpaid': return 'Nieopłacone';
    default: return 'Nieznany';
  }
}

export function getPaymentStatusClass(status: PaymentStatus): string {
  switch (status) {
    case 'paid': return 'paymentPaid';
    case 'deposit': return 'paymentDeposit';
    case 'unpaid': return 'paymentUnpaid';
    default: return '';
  }
}