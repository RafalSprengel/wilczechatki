import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Section,
  Heading,
  Hr,
  Button
} from '@react-email/components';
import * as React from 'react';

interface EmailVerificationProps {
  url: string;
}

export const EmailVerification = ({ url }: EmailVerificationProps) => {
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

  const footerHrStyle = {
    borderColor: '#e6ebf1',
    margin: '20px 0',
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
          <Heading style={headingStyle}>
            Potwierdź nowy adres e-mail – Wilcze Chatki
          </Heading>
          <Text style={textStyle}>
            Witaj,
          </Text>
          <Text style={textStyle}>
            otrzymaliśmy prośbę o zmianę adresu e-mail konta administratora. Kliknij poniższy przycisk, aby potwierdzić nowy adres:
          </Text>

          <Section style={{ textAlign: 'center' }}>
            <Button pX={24} pY={12} style={buttonStyle} href={url}>
              Potwierdź nowy adres e-mail
            </Button>
          </Section>

          <Text style={textStyle}>
            Jeśli to nie Ty prosiłeś o zmianę adresu e-mail, zignoruj tę wiadomość.
          </Text>

          <Hr style={footerHrStyle} />
          <Text style={footerTextStyle}>
            Wilcze Chatki – panel administracyjny
          </Text>
        </Container>
      </Body>
    </Html>
  );
};
