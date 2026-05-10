import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Heading,
  Hr,
  Link
} from '@react-email/components';
import * as React from 'react';
import { ISiteSettings } from '../db/models/SiteSettings';

interface UsernameReminderEmailProps {
  username: string;
  siteSettings: Partial<ISiteSettings>;
}

export const UsernameReminder = ({
  username,
  siteSettings,
}: UsernameReminderEmailProps) => {
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
            Przypomnienie loginu - Wilcze Chatki
          </Heading>
          <Text style={textStyle}>
            Witaj,
          </Text>
          <Text style={textStyle}>
            otrzymaliśmy prośbę o przypomnienie loginu do panelu administratora.
          </Text>
          <Text style={textStyle}>
            Twój login to: <strong>{username}</strong>
          </Text>
          <Text style={textStyle}>
            Jeśli to nie Ty wysłałeś tę prośbę, zignoruj tę wiadomość.
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

export default UsernameReminder;
