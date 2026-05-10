import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Section,
  Heading,
  Hr,
  Link,
  Button
} from '@react-email/components';
import * as React from 'react';
import { ISiteSettings } from '../db/models/SiteSettings';

interface PasswordResetEmailProps {
  url: string;
  siteSettings: Partial<ISiteSettings>;
}

export const PasswordReset = ({
  url,
  siteSettings,
}: PasswordResetEmailProps) => {
  const mainStyle = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  };

  const containerStyle = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '40px 20px',
    borderRadius: '8px',
    border: '1px solid #e6ebf1',
    maxWidth: '600px',
  };

  const headingStyle = {
    color: '#1a1a1a',
    fontSize: '24px',
    fontWeight: 'bold' as const,
    lineHeight: '1.2',
  };

  const textStyle = {
    fontSize: '16px',
    color: '#4d4d4d',
    lineHeight: '1.5',
  };

  const buttonStyle = {
    backgroundColor: '#222',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    width: 'fit-content',
    margin: '30px auto',
    padding: '12px 24px',
  };

  const footerTextStyle = {
    fontSize: '12px',
    color: '#8898aa',
    lineHeight: '1.4',
  };

  const footerHrStyle = {
    borderColor: '#e6ebf1',
    margin: '20px 0',
  };

  const footerLinkStyle = {
    color: '#0070f3',
    fontSize: '12px',
    textDecoration: 'none',
  };

  return (
    <Html>
      <Head />
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>
            Zresetuj swoje hasło - Wilcze Chatki
          </Heading>
          <Text style={textStyle}>
            Witaj,
          </Text>
          <Text style={textStyle}>
            otrzymaliśmy prośbę o zresetowanie hasła dla Twojego konta. Kliknij poniższy przycisk, aby ustawić nowe hasło:
          </Text>

          <Section style={{ textAlign: 'center' }}>
            <Button pX={24} pY={12} style={buttonStyle} href={url}>
              Ustaw nowe hasło
            </Button>
          </Section>

          <Text style={textStyle}>
            Link jest ważny przez ograniczony czas. Jeśli to nie Ty prosiłeś o reset hasła, po prostu zignoruj tę wiadomość.
          </Text>

          <Hr style={footerHrStyle} />
          <Text style={footerTextStyle}>
            W razie pytań prosimy o kontakt na {siteSettings.email} lub telefonicznie pod numerem {siteSettings.phoneDisplay}.
          </Text>
          <Link href="https://rafalsprengel.com" style={footerLinkStyle}>
            rafalsprengel.com
          </Link>
        </Container>
      </Body>
    </Html>
  );
};

export default PasswordReset;
