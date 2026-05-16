import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Section,
  Heading,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { ISiteSettings } from '../db/models/SiteSettings';

interface BookingConfirmationToAdminProps {
  customerName: string;
  orderNumber: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  siteSettings: Partial<ISiteSettings>;
}

export default function BookingConfirmationToAdmin({
  customerName,
  orderNumber,
  checkIn,
  checkOut,
  totalPrice,
  siteSettings,
}: BookingConfirmationToAdminProps) {
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

  const badgeStyle = {
    display: 'inline-block' as const,
    backgroundColor: '#22c55e',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 'bold' as const,
    padding: '4px 12px',
    borderRadius: '4px',
    marginBottom: '20px',
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

  return (
    <Html>
      <Head />
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Text style={badgeStyle}>Nowa rezerwacja online</Text>
          <Heading style={headingStyle}>
            Wilcze Chatki — panel administracyjny
          </Heading>
          <Text style={textStyle}>
            Otrzymano nową, opłaconą rezerwację przez Stripe.
          </Text>

          <Section style={sectionStyle}>
            <Text style={sectionTextStyle}><strong>Gość:</strong> {customerName}</Text>
            <Text style={sectionTextStyle}><strong>Nr zamówienia:</strong> {orderNumber}</Text>
            <Text style={sectionTextStyle}><strong>Zameldowanie:</strong> {checkIn}</Text>
            <Text style={sectionTextStyle}><strong>Wymeldowanie:</strong> {checkOut}</Text>
            <Hr style={hrStyle} />
            <Text style={sumStyle}>Kwota: {totalPrice} PLN</Text>
          </Section>

          <Text style={footerTextStyle}>
            Ta wiadomość została wygenerowana automatycznie przez system rezerwacji Wilcze Chatki.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
