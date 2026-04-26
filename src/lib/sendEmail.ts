import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('Brak klucza API Resend w zmiennych środowiskowych.');
}

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailProps {
  to: string;
  subject: string;
  html: string;
}

export async function sendBookingEmail({
  to,
  subject,
  html,
}: SendEmailProps) {
  return resend.emails.send({
    from: 'Wilcze Chatki <rezerwacje@rafalsprengel.com>',
    to,
    subject,
    html,
  });
}