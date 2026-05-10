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
import { ISiteSettings } from "../db/models/SiteSettings";

interface ContactAutoReplyProps {
  customerName: string;
  message: string;
  siteSettings: Partial<ISiteSettings>;
}

export const ContactAutoReply = ({
  customerName,
  message,
  siteSettings,
}: ContactAutoReplyProps) => {
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

  const textStyle = {
    fontSize: "16px",
    color: "#4d4d4d",
    lineHeight: "1.5",
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
          <Heading style={headingStyle}>Dziękujemy za wiadomość</Heading>
          <Text style={textStyle}>Dzień dobry {customerName},</Text>
          <Text style={textStyle}>
            dziękujemy za kontakt z Wilczymi Chatkami. Otrzymaliśmy Twoją
            wiadomość i wrócimy z odpowiedzią tak szybko, jak to możliwe.
          </Text>

          <Section style={sectionStyle}>
            <Text style={sectionTextStyle}>
              <strong>Przesłana wiadomość:</strong>
            </Text>
            <Text style={messageStyle}>{message}</Text>
          </Section>

          <Text style={textStyle}>
            Jeśli sprawa jest pilna, możesz skontaktować się z nami również
            telefonicznie:{" "}
            <Link href={`tel:${siteSettings.phoneHref}`}>
              {siteSettings.phoneDisplay}
            </Link>
            .
          </Text>
          <Text style={textStyle}>Pozdrawiamy,</Text>
          <Text style={textStyle}>Wilcze Chatki</Text>
          <Text style={footerTextStyle}>E-mail: {siteSettings.email}</Text>
          <Hr style={footerHrStyle} />
          <Link href="https://wilczechatki.pl" style={footerLinkStyle}>
            wilczechatki.pl
          </Link>
        </Container>
      </Body>
    </Html>
  );
};

export default ContactAutoReply;
