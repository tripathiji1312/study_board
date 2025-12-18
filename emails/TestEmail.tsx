import {
    Section,
    Text,
    Hr,
} from '@react-email/components'
import * as React from 'react'
import { StudyBoardEmail } from './StudyBoardEmail'

interface TestEmailProps {
    userName?: string
}

export function TestEmail({ userName }: TestEmailProps) {
    return (
        <StudyBoardEmail
            previewText="🧪 Your Study Board notifications are working!"
            heading="Your notifications are set up! 🎉"
            userName={userName}
        >
            <Section style={welcomeSection}>
                <Text style={welcomeText}>
                    Great news! Your email notifications are working perfectly.
                    You're all set to receive timely reminders about your:
                </Text>
            </Section>

            <Section style={featureList}>
                <FeatureItem emoji="📚" title="Assignments" description="Get notified as deadlines approach" />
                <FeatureItem emoji="📝" title="Exams" description="Never miss an exam with advance alerts" />
                <FeatureItem emoji="✅" title="Tasks" description="Stay on top of your to-do list" />
                <FeatureItem emoji="📊" title="Daily Digest" description="A summary of what needs your attention" />
            </Section>

            <Hr style={divider} />

            <Section style={previewSection}>
                <Text style={previewTitle}>📬 What your notifications will look like:</Text>

                {/* Sample Assignment Card */}
                <Section style={sampleCard}>
                    <Text style={sampleCardTitle}>Operating Systems Assignment</Text>
                    <Text style={sampleCardMeta}>CSE3003 • VTOP</Text>
                    <Text style={sampleBadge}>🔥 Due Tomorrow</Text>
                </Section>

                {/* Sample Exam Card */}
                <Section style={sampleCardExam}>
                    <Text style={sampleCardTitle}>📝 CAT 1 - Data Structures</Text>
                    <Text style={sampleCardMeta}>Room: AB1-501 • Seat: 23</Text>
                    <Text style={sampleCountdown}>⏰ 3 days away</Text>
                </Section>
            </Section>

            <Hr style={divider} />

            <Section style={tipsSection}>
                <Text style={tipsTitle}>🚀 Quick Setup Tips</Text>
                <Text style={tipItem}>✓ Add your assignments with due dates for timely reminders</Text>
                <Text style={tipItem}>✓ Set up your exam schedule for advance notifications</Text>
                <Text style={tipItem}>✓ Use the "Today" category for tasks that need immediate attention</Text>
                <Text style={tipItem}>✓ Check your dashboard daily to stay on track</Text>
            </Section>

            <Section style={ctaSection}>
                <Text style={ctaText}>
                    Ready to crush your goals? Open Study Board and start organizing! 💪
                </Text>
            </Section>
        </StudyBoardEmail>
    )
}

function FeatureItem({ emoji, title, description }: { emoji: string; title: string; description: string }) {
    return (
        <Section style={featureItem}>
            <Text style={featureEmoji}>{emoji}</Text>
            <Section style={featureContent}>
                <Text style={featureTitle}>{title}</Text>
                <Text style={featureDescription}>{description}</Text>
            </Section>
        </Section>
    )
}

// Styles
const welcomeSection = {
    marginBottom: '24px',
}

const welcomeText = {
    color: '#334155',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0',
}

const featureList = {
    marginBottom: '24px',
}

const featureItem = {
    display: 'flex' as const,
    alignItems: 'flex-start' as const,
    marginBottom: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '12px 16px',
}

const featureEmoji = {
    fontSize: '24px',
    margin: '0 12px 0 0',
    lineHeight: '1',
}

const featureContent = {
    flex: '1',
}

const featureTitle = {
    color: '#1a1a2e',
    fontSize: '14px',
    fontWeight: '600' as const,
    margin: '0 0 2px 0',
}

const featureDescription = {
    color: '#64748b',
    fontSize: '12px',
    margin: '0',
}

const divider = {
    borderColor: '#e2e8f0',
    margin: '24px 0',
}

const previewSection = {
    marginBottom: '24px',
}

const previewTitle = {
    color: '#1a1a2e',
    fontSize: '14px',
    fontWeight: '600' as const,
    marginBottom: '16px',
}

const sampleCard = {
    backgroundColor: '#fff5f5',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '8px',
    border: '1px solid #fed7d7',
}

const sampleCardExam = {
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '8px',
    border: '1px solid #bae6fd',
}

const sampleCardTitle = {
    color: '#1a1a2e',
    fontSize: '14px',
    fontWeight: '600' as const,
    margin: '0 0 4px 0',
}

const sampleCardMeta = {
    color: '#64748b',
    fontSize: '12px',
    margin: '0 0 8px 0',
}

const sampleBadge = {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    fontSize: '11px',
    fontWeight: '600' as const,
    padding: '4px 8px',
    borderRadius: '4px',
    display: 'inline-block' as const,
}

const sampleCountdown = {
    color: '#0284c7',
    fontSize: '12px',
    fontWeight: '600' as const,
}

const tipsSection = {
    backgroundColor: '#fefce8',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #fef08a',
    marginBottom: '24px',
}

const tipsTitle = {
    color: '#854d0e',
    fontSize: '14px',
    fontWeight: '600' as const,
    margin: '0 0 12px 0',
}

const tipItem = {
    color: '#a16207',
    fontSize: '13px',
    margin: '0 0 8px 0',
    lineHeight: '1.4',
}

const ctaSection = {
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '8px',
    padding: '20px',
    background: '#667eea',
}

const ctaText = {
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '500' as const,
    margin: '0',
}

export default TestEmail
