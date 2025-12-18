import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components'
import * as React from 'react'

interface StudyBoardEmailProps {
    previewText: string
    heading: string
    userName?: string
    children: React.ReactNode
}

// Motivational quotes for the footer
const quotes = [
    "Success is the sum of small efforts repeated day in and day out. – Robert Collier",
    "The secret of getting ahead is getting started. – Mark Twain",
    "Don't watch the clock; do what it does. Keep going. – Sam Levenson",
    "Education is the passport to the future. – Malcolm X",
    "The only way to do great work is to love what you do. – Steve Jobs",
]

export function StudyBoardEmail({
    previewText,
    heading,
    userName,
    children,
}: StudyBoardEmailProps) {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header with gradient */}
                    <Section style={header}>
                        <Heading style={logo}>📚 Study Board</Heading>
                        {userName && (
                            <Text style={greeting}>Hey {userName}! 👋</Text>
                        )}
                    </Section>

                    {/* Main heading */}
                    <Section style={headingSection}>
                        <Heading style={mainHeading}>{heading}</Heading>
                    </Section>

                    {/* Content */}
                    <Section style={content}>
                        {children}
                    </Section>

                    {/* Motivational footer */}
                    <Section style={footer}>
                        <Text style={quoteText}>💡 {randomQuote}</Text>
                        <Text style={footerText}>
                            Stay focused, stay motivated! 🚀
                        </Text>
                        <Text style={footerLink}>
                            <Link href="#" style={link}>Open Study Board</Link>
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    )
}

// Styles
const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
}

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '0',
    marginBottom: '40px',
    borderRadius: '12px',
    overflow: 'hidden' as const,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    maxWidth: '600px',
}

const header = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '32px 40px',
    textAlign: 'center' as const,
}

const logo = {
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: '700' as const,
    margin: '0',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
}

const greeting = {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '16px',
    margin: '12px 0 0 0',
}

const headingSection = {
    padding: '32px 40px 16px',
}

const mainHeading = {
    color: '#1a1a2e',
    fontSize: '24px',
    fontWeight: '600' as const,
    margin: '0',
    lineHeight: '1.3',
}

const content = {
    padding: '0 40px 32px',
}

const footer = {
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #e2e8f0',
    padding: '24px 40px',
    textAlign: 'center' as const,
}

const quoteText = {
    color: '#64748b',
    fontSize: '13px',
    fontStyle: 'italic' as const,
    margin: '0 0 16px 0',
    lineHeight: '1.5',
}

const footerText = {
    color: '#94a3b8',
    fontSize: '14px',
    margin: '0 0 8px 0',
}

const footerLink = {
    margin: '0',
}

const link = {
    color: '#667eea',
    fontSize: '14px',
    textDecoration: 'none',
    fontWeight: '500' as const,
}

export default StudyBoardEmail
