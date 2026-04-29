import type { ReactNode } from "react";
import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("Brak klucza API Resend w zmiennych środowiskowych.");
}

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailBaseProps {
  to: string;
  subject: string;
  replyTo?: string;
}

type SendEmailProps =
  | (SendEmailBaseProps & {
      html: string;
      react?: never;
    })
  | (SendEmailBaseProps & {
      react: ReactNode;
      html?: never;
    });

export async function sendEmail({
  to,
  subject,
  replyTo,
  ...content
}: SendEmailProps) {
  return resend.emails.send({
    from: "Wilcze Chatki <rezerwacje@rafalsprengel.com>",
    to,
    subject,
    replyTo,
    ...content,
  });
}

export async function sendBookingEmail(props: SendEmailProps) {
  return sendEmail(props);
}
