export async function requestNotificationPermission() {
    if (!("Notification" in window)) {
        console.warn("This browser does not support desktop notification")
        return false
    }

    if (Notification.permission === "granted") {
        return true
    }

    const permission = await Notification.requestPermission()
    return permission === "granted"
}

export function sendNotification(title: string, options?: NotificationOptions) {
    if (Notification.permission === "granted") {
        new Notification(title, {
            icon: "/favicon.ico", // Assuming standard Next.js favicon
            ...options
        })
    }
}

// Logic to check for overdue items
export function checkDeadlines(
    items: { id: string | number; title: string; dueDate?: string; status?: string; completed?: boolean }[],
    notifiedIds: Set<string | number>
): string[] {
    const now = new Date()
    const newNotifications: string[] = []

    items.forEach(item => {
        // Skip if done
        if (item.status === "Completed" || item.completed) return
        if (!item.dueDate) return
        if (notifiedIds.has(item.id)) return

        const due = new Date(item.dueDate)
        const diffMs = due.getTime() - now.getTime()
        const diffHours = diffMs / (1000 * 60 * 60)

        // Notify if due within 24 hours (and not already past due by a lot, e.g. -24h)
        if (diffHours <= 24 && diffHours > -1) {
            sendNotification(`Deadline Approaching: ${item.title}`, {
                body: `Due ${diffHours > 0 ? 'in ' + Math.round(diffHours) + ' hours' : 'very soon!'}`,
                tag: String(item.id)
            })
            newNotifications.push(String(item.id))
        }
    })

    return newNotifications
}
