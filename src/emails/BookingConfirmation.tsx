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

interface BookingEmailProps {
  customerName: string;
  orderNumber: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  siteSettings: Partial<ISiteSettings>;
}

export const BookingConfirmation = ({
  customerName,
  orderNumber,
  checkIn,
  checkOut,
  totalPrice,
  siteSettings
}: BookingEmailProps) => {
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

  const sumStyle = {
    fontSize: '18px',
    fontWeight: 'bold' as const,
    color: '#1a1a1a',
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
            Potwierdzenie Rezerwacji - Wilcze Chatki
          </Heading>
          <Text style={textStyle}>
            Witaj <strong>{customerName}</strong>,
          </Text>
          <Text style={textStyle}>
            Twoja płatność za pobyt na Kaszubach została pomyślnie przetworzona.
          </Text>
          
          <Section style={sectionStyle}>
            <Text style={sectionTextStyle}><strong>Nr zamówienia:</strong> {orderNumber}</Text>
            <Text style={sectionTextStyle}><strong>Zameldowanie:</strong> {checkIn}</Text>
            <Text style={sectionTextStyle}><strong>Wymeldowanie:</strong> {checkOut}</Text>
            <Hr style={hrStyle} />
            <Text style={sumStyle}>Suma: {totalPrice} PLN</Text>
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

export default BookingConfirmation;