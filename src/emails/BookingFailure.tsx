import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Section,
  Heading,
  Hr,
  Link
} from '@react-email/components';
import * as React from 'react';
import { SITE_CONFIG } from '../config/site';

import { ISiteSettings } from '../db/models/SiteSettings';

interface BookingFailureEmailProps {
  customerName: string;
  orderNumber: string;
  checkIn: string;
  checkOut: string;
  siteSettings: Partial<ISiteSettings>;
}

export const BookingFailure = ({
  customerName,
  orderNumber,
  checkIn,
  checkOut,
  siteSettings
}: BookingFailureEmailProps) => {
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
    color: '#b00020',
    fontSize: '24px',
    fontWeight: 'bold' as const,
    lineHeight: '1.2',
  };

  const textStyle = {
    fontSize: '16px',
    color: '#4d4d4d',
    lineHeight: '1.5',
  };

  const sectionStyle = {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '4px',
    margin: '20px 0',
  };

  const sectionTextStyle = {
    fontSize: '14px',
    margin: '8px 0',
    color: '#333',
  };

  const hrStyle = {
    borderColor: '#e6ebf1',
    margin: '15px 0',
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
            Nieudana płatność za rezerwację
          </Heading>
          <Text style={textStyle}>
            Witaj <strong>{customerName}</strong>,
          </Text>
          <Text style={textStyle}>
            Niestety, Twoja płatność nie powiodła się. Rezerwacja została anulowana.
          </Text>
          <Section style={sectionStyle}>
            <Text style={sectionTextStyle}><strong>Nr zamówienia:</strong> {orderNumber}</Text>
            <Text style={sectionTextStyle}><strong>Zameldowanie:</strong> {checkIn}</Text>
            <Text style={sectionTextStyle}><strong>Wymeldowanie:</strong> {checkOut}</Text>
          </Section>
          <Text style={textStyle}>
            W razie pytań prosimy o kontakt na {siteSettings.email} lub telefonicznie pod numerem {siteSettings.phoneDisplay}.
          </Text>
          <Hr style={footerHrStyle} />
          <Link href="https://rafalsprengel.com" style={footerLinkStyle}>
            rafalsprengel.com
          </Link>
        </Container>
      </Body>
    </Html>
  );
};

export default BookingFailure;
