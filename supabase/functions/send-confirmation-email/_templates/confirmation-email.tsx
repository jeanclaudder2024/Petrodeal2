import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Button,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface ConfirmationEmailProps {
  name: string
  confirmationUrl: string
}

export const ConfirmationEmail = ({
  name,
  confirmationUrl,
}: ConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>🔒 Activate Your PetroDealHub Account & Start Your Free Global Trial</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          🔒 PetroDealHub
        </Heading>
        
        <Text style={greeting}>
          Hello {name},
        </Text>
        
        <Text style={text}>
          Thank you for joining <strong>PetroDealHub</strong>, the world's leading platform connecting ports, refineries, and vessels in one place.
        </Text>
        
        <Text style={text}>
          Click below to activate your account:
        </Text>
        
        <Section style={buttonContainer}>
          <Button
            href={confirmationUrl}
            style={button}
          >
            🔒 Confirm Email
          </Button>
        </Section>
        
        <Text style={benefitsTitle}>
          What you'll get after activation:
        </Text>
        
        <Section style={benefitsList}>
          <Text style={benefitItem}>🔒 Real-time vessel & port tracking worldwide.</Text>
          <Text style={benefitItem}>🔒 Updated oil prices & refinery data.</Text>
          <Text style={benefitItem}>🔒 5-Day Free Trial – no upfront charge.</Text>
          <Text style={benefitItem}>🔒 30-Day Money Back Guarantee.</Text>
        </Section>
        
        <Hr style={hr} />
        
        <Text style={footer}>
          Best regards,<br />
          <strong>PetroDealHub Team</strong> 🔒
        </Text>
        
        <Text style={disclaimer}>
          If you didn't create an account with PetroDealHub, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ConfirmationEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  maxWidth: '600px',
}

const h1 = {
  color: '#1a365d',
  fontSize: '28px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '40px 0 20px',
  padding: '0 20px',
}

const greeting = {
  color: '#1a365d',
  fontSize: '18px',
  fontWeight: '600',
  margin: '20px 0 16px',
  padding: '0 20px',
}

const text = {
  color: '#2d3748',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '16px 0',
  padding: '0 20px',
}

const benefitsTitle = {
  color: '#1a365d',
  fontSize: '16px',
  fontWeight: '600',
  margin: '24px 0 16px',
  padding: '0 20px',
}

const benefitsList = {
  padding: '0 20px',
  margin: '0',
}

const benefitItem = {
  color: '#2d3748',
  fontSize: '15px',
  lineHeight: '1.8',
  margin: '8px 0',
  padding: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#3182ce',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  border: 'none',
  cursor: 'pointer',
}

const hr = {
  borderColor: '#e2e8f0',
  margin: '32px 20px',
}

const footer = {
  color: '#1a365d',
  fontSize: '16px',
  fontWeight: '500',
  margin: '24px 0 16px',
  padding: '0 20px',
}

const disclaimer = {
  color: '#718096',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '16px 0',
  padding: '0 20px',
  textAlign: 'center' as const,
}