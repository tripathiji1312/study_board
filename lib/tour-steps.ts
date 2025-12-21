
export type TourStep = {
    targetId: string; // The ID of the element to highlight. Use 'center' for no element.
    title: string;
    description: string;
    position?: "top" | "bottom" | "left" | "right" | "center";
}

export const TOUR_STEPS: TourStep[] = [
    {
        targetId: "center",
        title: "Welcome to StudyBoard",
        description: "Let's take a quick tour to help you get the most out of your new study companion.",
        position: "center"
    },
    {
        targetId: "smart-schedule-widget",
        title: "Smart Schedule",
        description: "See your upcoming classes and tasks. The 'Reschedule' button uses AI to reorganize overdue tasks.",
        position: "left"
    },
    {
        targetId: "mood-tracker-widget",
        title: "Mood & Energy",
        description: "Log your mood to get AI-powered task recommendations that match your current energy level.",
        position: "bottom"
    },
    {
        targetId: "quick-actions-menu",
        title: "Quick Actions",
        description: "Press Cmd+K or click here to quickly add tasks, exams, or find resources.",
        position: "right"
    },
    {
        targetId: "sidebar-settings",
        title: "Configure AI",
        description: "Visit Settings to add your free Groq and Resend API keys. StudyBoard needs them to power its AI features.",
        position: "right"
    }
]
