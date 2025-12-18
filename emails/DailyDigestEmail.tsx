import {
    Section,
    Text,
    Row,
    Column,
    Hr,
} from '@react-email/components'
import * as React from 'react'
import { StudyBoardEmail } from './StudyBoardEmail'

interface Assignment {
    id: number
    title: string
    subject: string
    due: string
    priority: string
    platform?: string | null
}

interface Exam {
    id: number
    title: string
    date: string
    room?: string | null
    seat?: string | null
    daysUntil: number
}


interface Todo {
    id: string
    text: string
    dueDate?: string
    category: string
}

interface DailyDigestEmailProps {
    userName?: string
    overdue: Assignment[]
    dueToday: Assignment[]
    dueTomorrow: Assignment[]
    dueThisWeek: Assignment[]
    upcomingExams: Exam[]
    pendingTodos: Todo[]
    stats: {
        completedToday: number
        pendingTotal: number
    }
}

export function DailyDigestEmail({
    userName,
    overdue = [],
    dueToday = [],
    dueTomorrow = [],
    dueThisWeek = [],
    upcomingExams = [],
    pendingTodos = [],
    stats = { completedToday: 0, pendingTotal: 0 },
}: DailyDigestEmailProps) {
    const totalUrgent = overdue.length + dueToday.length
    const previewText = totalUrgent > 0
        ? `🚨 ${totalUrgent} urgent item${totalUrgent > 1 ? 's' : ''} need your attention!`
        : `📋 Your daily study digest is ready`

    const heading = totalUrgent > 0
        ? `You have ${totalUrgent} urgent item${totalUrgent > 1 ? 's' : ''}!`
        : `Here's your daily study digest`

    return (
        <StudyBoardEmail
            previewText={previewText}
            heading={heading}
            userName={userName}
        >
            {/* Quick Stats */}
            <Section style={statsSection}>
                <Row>
                    <Column style={statBox}>
                        <Text style={statNumber}>{stats.completedToday}</Text>
                        <Text style={statLabel}>Completed Today ✅</Text>
                    </Column>
                    <Column style={statBox}>
                        <Text style={statNumber}>{stats.pendingTotal}</Text>
                        <Text style={statLabel}>Pending Items 📝</Text>
                    </Column>
                </Row>
            </Section>

            {/* Overdue - Most Critical */}
            {overdue.length > 0 && (
                <Section style={sectionBlock}>
                    <Text style={sectionTitle}>🔴 Overdue</Text>
                    {overdue.map((item) => (
                        <AssignmentCard key={item.id} item={item} urgent />
                    ))}
                </Section>
            )}

            {/* Due Today */}
            {dueToday.length > 0 && (
                <Section style={sectionBlock}>
                    <Text style={sectionTitle}>⚡ Due Today</Text>
                    {dueToday.map((item) => (
                        <AssignmentCard key={item.id} item={item} urgent />
                    ))}
                </Section>
            )}

            {/* Due Tomorrow */}
            {dueTomorrow.length > 0 && (
                <Section style={sectionBlock}>
                    <Text style={sectionTitle}>🟠 Due Tomorrow</Text>
                    {dueTomorrow.map((item) => (
                        <AssignmentCard key={item.id} item={item} />
                    ))}
                </Section>
            )}

            {/* Due This Week */}
            {dueThisWeek.length > 0 && (
                <Section style={sectionBlock}>
                    <Text style={sectionTitle}>🟡 Due This Week</Text>
                    {dueThisWeek.map((item) => (
                        <AssignmentCard key={item.id} item={item} />
                    ))}
                </Section>
            )}

            {/* Upcoming Exams */}
            {upcomingExams.length > 0 && (
                <Section style={sectionBlock}>
                    <Text style={sectionTitle}>📚 Upcoming Exams</Text>
                    {upcomingExams.map((exam) => (
                        <ExamCard key={exam.id} exam={exam} />
                    ))}
                </Section>
            )}

            {/* Pending Todos */}
            {pendingTodos.length > 0 && (
                <Section style={sectionBlock}>
                    <Text style={sectionTitle}>✅ Quick Tasks</Text>
                    <Section style={todoList}>
                        {pendingTodos.slice(0, 5).map((todo) => (
                            <Text key={todo.id} style={todoItem}>
                                ○ {todo.text}
                                {todo.dueDate && <span style={todoDue}> (due {todo.dueDate})</span>}
                            </Text>
                        ))}
                        {pendingTodos.length > 5 && (
                            <Text style={moreItems}>
                                +{pendingTodos.length - 5} more tasks...
                            </Text>
                        )}
                    </Section>
                </Section>
            )}

            {/* No items message */}
            {overdue.length === 0 && dueToday.length === 0 && dueTomorrow.length === 0 && dueThisWeek.length === 0 && upcomingExams.length === 0 && (
                <Section style={emptyState}>
                    <Text style={emptyEmoji}>🎉</Text>
                    <Text style={emptyText}>All caught up! No urgent deadlines.</Text>
                    <Text style={emptySubtext}>Keep up the great work!</Text>
                </Section>
            )}

            <Hr style={divider} />

            {/* Tips Section */}
            <Section style={tipsSection}>
                <Text style={tipsTitle}>💡 Pro Tip</Text>
                <Text style={tipsText}>
                    {getRandomTip()}
                </Text>
            </Section>
        </StudyBoardEmail>
    )
}

// Helper Components
function AssignmentCard({ item, urgent = false }: { item: Assignment; urgent?: boolean }) {
    return (
        <Section style={urgent ? cardUrgent : card}>
            <Row>
                <Column>
                    <Text style={cardTitle}>{item.title}</Text>
                    <Text style={cardMeta}>
                        {item.subject} {item.platform && `• ${item.platform}`}
                    </Text>
                </Column>
                <Column style={cardRight}>
                    <Text style={urgent ? badgeUrgent : badgeNormal}>
                        {item.priority === 'Urgent' || item.priority === 'High' ? '🔥' : '📌'} {item.due}
                    </Text>
                </Column>
            </Row>
        </Section>
    )
}

function ExamCard({ exam }: { exam: Exam }) {
    const isUrgent = exam.daysUntil <= 3
    return (
        <Section style={isUrgent ? cardUrgent : card}>
            <Row>
                <Column>
                    <Text style={cardTitle}>📝 {exam.title}</Text>
                    <Text style={cardMeta}>
                        {exam.date}
                        {exam.room && ` • Room: ${exam.room}`}
                        {exam.seat && ` • Seat: ${exam.seat}`}
                    </Text>
                </Column>
                <Column style={cardRight}>
                    <Text style={isUrgent ? countdownUrgent : countdown}>
                        {exam.daysUntil === 0 ? 'TODAY!' : exam.daysUntil === 1 ? 'Tomorrow' : `${exam.daysUntil} days`}
                    </Text>
                </Column>
            </Row>
        </Section>
    )
}

// Random tips
function getRandomTip() {
    const tips = [
        "Break large assignments into smaller chunks. It makes them feel more manageable!",
        "Use the Pomodoro technique: 25 mins focus, 5 mins break. Your brain will thank you!",
        "Review your notes within 24 hours of class to boost retention by 80%.",
        "Teach someone else what you learned. It's the best way to solidify knowledge.",
        "Take care of yourself! A well-rested mind learns 40% faster.",
        "Set specific goals for each study session. 'Study biology' becomes 'Complete 20 flashcards'.",
        "Your environment matters. Find a consistent study spot that signals 'focus time' to your brain.",
    ]
    return tips[Math.floor(Math.random() * tips.length)]
}

// Styles
const statsSection = {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
}

const statBox = {
    textAlign: 'center' as const,
    padding: '8px',
}

const statNumber = {
    color: '#667eea',
    fontSize: '28px',
    fontWeight: '700' as const,
    margin: '0',
}

const statLabel = {
    color: '#64748b',
    fontSize: '12px',
    margin: '4px 0 0 0',
}

const sectionBlock = {
    marginBottom: '24px',
}

const sectionTitle = {
    color: '#1a1a2e',
    fontSize: '16px',
    fontWeight: '600' as const,
    marginBottom: '12px',
    borderBottom: '2px solid #e2e8f0',
    paddingBottom: '8px',
}

const card = {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '8px',
    border: '1px solid #e2e8f0',
}

const cardUrgent = {
    backgroundColor: '#fff5f5',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '8px',
    border: '1px solid #fed7d7',
}

const cardTitle = {
    color: '#1a1a2e',
    fontSize: '14px',
    fontWeight: '600' as const,
    margin: '0 0 4px 0',
}

const cardMeta = {
    color: '#64748b',
    fontSize: '12px',
    margin: '0',
}

const cardRight = {
    textAlign: 'right' as const,
    width: '120px',
}

const badgeUrgent = {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    fontSize: '11px',
    fontWeight: '600' as const,
    padding: '4px 8px',
    borderRadius: '4px',
    display: 'inline-block' as const,
}

const badgeNormal = {
    backgroundColor: '#e2e8f0',
    color: '#475569',
    fontSize: '11px',
    fontWeight: '500' as const,
    padding: '4px 8px',
    borderRadius: '4px',
    display: 'inline-block' as const,
}

const countdown = {
    color: '#667eea',
    fontSize: '12px',
    fontWeight: '600' as const,
}

const countdownUrgent = {
    color: '#dc2626',
    fontSize: '12px',
    fontWeight: '700' as const,
}

const todoList = {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '12px 16px',
}

const todoItem = {
    color: '#334155',
    fontSize: '13px',
    margin: '0 0 8px 0',
    lineHeight: '1.5',
}

const todoDue = {
    color: '#94a3b8',
    fontSize: '11px',
}

const moreItems = {
    color: '#667eea',
    fontSize: '12px',
    fontStyle: 'italic' as const,
    margin: '8px 0 0 0',
}

const emptyState = {
    textAlign: 'center' as const,
    padding: '32px',
}

const emptyEmoji = {
    fontSize: '48px',
    margin: '0 0 16px 0',
}

const emptyText = {
    color: '#1a1a2e',
    fontSize: '18px',
    fontWeight: '600' as const,
    margin: '0 0 8px 0',
}

const emptySubtext = {
    color: '#64748b',
    fontSize: '14px',
    margin: '0',
}

const divider = {
    borderColor: '#e2e8f0',
    margin: '24px 0',
}

const tipsSection = {
    backgroundColor: '#f0fdf4',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #bbf7d0',
}

const tipsTitle = {
    color: '#166534',
    fontSize: '14px',
    fontWeight: '600' as const,
    margin: '0 0 8px 0',
}

const tipsText = {
    color: '#15803d',
    fontSize: '13px',
    margin: '0',
    lineHeight: '1.5',
}

export default DailyDigestEmail
