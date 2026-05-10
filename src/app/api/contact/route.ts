import { NextResponse } from "next/server";
import { z } from "zod";
import { getSiteSettings } from "@/actions/siteSettingsActions";
import ContactAdminNotification from "@/emails/ContactAdminNotification";
import ContactAutoReply from "@/emails/ContactAutoReply";
import { sendEmail } from "@/lib/sendEmail";

export const runtime = "nodejs";

const contactRequestSchema = z.object({
  name: z.string().trim().min(3, "Proszę podać imię i nazwisko."),
  email: z.string().trim().email("Proszę podać poprawny adres e-mail."),
  message: z.string().trim().min(10, "Wiadomość powinna mieć min. 10 znaków."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedBody = contactRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      const validationError = parsedBody.error.issues[0]?.message;

      if (!validationError) {
        throw new Error("Nie udało się zwalidować formularza kontaktowego.");
      }

      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const { name, email, message } = parsedBody.data;

    const siteSettings = await getSiteSettings();

    await sendEmail({
      to: siteSettings.email || '',
      subject: `Formularz kontaktowy: ${name}`,
      react: ContactAdminNotification({
        senderName: name,
        senderEmail: email,
        message,
      }),
      replyTo: email,
    });

    await sendEmail({
      to: email,
      subject: "Potwierdzenie otrzymania wiadomości - Wilcze Chatki",
      react: ContactAutoReply({
        customerName: name,
        message,
        siteSettings,
      }),
    });

    return NextResponse.json(
      { message: "Wiadomość została wysłana." },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Nie udało się wysłać wiadomości.";
    console.error("[CONTACT] Błąd wysyłki formularza kontaktowego:", error);
    return NextResponse.json({ message }, { status: 500 });
  }
}
