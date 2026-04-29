import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Section,
  Text,
} from "@react-email/components";
import { SITE_CONFIG } from "../config/site";

interface ContactAdminNotificationProps {
  senderName: string;
  senderEmail: string;
  message: string;
}

export const ContactAdminNotification = ({
  senderName,
  senderEmail,
  message,
}: ContactAdminNotificationProps) => {
  const mainStyle = {
    backgroundColor: "#f6f9fc",
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  };

  const containerStyle = {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "40px 20px",
    borderRadius: "8px",
    border: "1px solid #e6ebf1",
    maxWidth: "600px",
  };

  const headingStyle = {
    color: "#1a1a1a",
    fontSize: "24px",
    fontWeight: "bold" as const,
    lineHeight: "1.2",
  };

  const sectionStyle = {
    backgroundColor: "#f9f9f9",
    padding: "20px",
    borderRadius: "4px",
    margin: "20px 0",
  };

  const sectionTextStyle = {
    fontSize: "14px",
    margin: "8px 0",
    color: "#333",
  };

  const messageStyle = {
    ...sectionTextStyle,
    whiteSpace: "pre-wrap" as const,
  };

  const footerTextStyle = {
    fontSize: "12px",
    color: "#8898aa",
    lineHeight: "1.4",
  };

  const footerHrStyle = {
    borderColor: "#e6ebf1",
    margin: "20px 0",
  };

  const footerLinkStyle = {
    color: "#0070f3",
    fontSize: "12px",
    textDecoration: "none",
  };

  return (
    <Html>
      <Head />
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>
            Nowa wiadomość z formularza kontaktowego
          </Heading>

          <Section style={sectionStyle}>
            <Text style={sectionTextStyle}>
              <strong>Imię i nazwisko:</strong> {senderName}
            </Text>
            <Text style={sectionTextStyle}>
              <strong>E-mail:</strong> {senderEmail}
            </Text>
            <Text style={sectionTextStyle}>
              <strong>Wiadomość:</strong>
            </Text>
            <Text style={messageStyle}>{message}</Text>
          </Section>

          <Text style={footerTextStyle}>
            Odpowiedz bezpośrednio na tę wiadomość albo skontaktuj się przez{" "}
            {SITE_CONFIG.email} / {SITE_CONFIG.phoneDisplay}.
          </Text>
          <Hr style={footerHrStyle} />
          <Link href="https://wilczechatki.pl" style={footerLinkStyle}>
            wilczechatki.pl
          </Link>
        </Container>
      </Body>
    </Html>
  );
};

export default ContactAdminNotification;
