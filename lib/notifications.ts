export async function requestNotificationPermission() {
    // SSR safety check - window may not exist during server-side rendering
    if (typeof window === "undefined") {
        return false
    }

    if (!("Notification" in window)) {
        console.warn("This browser does not support desktop notification")
        return false
    }

    if (Notification.permission === "granted") {
        return true
    }

    try {
        const permission = await Notification.requestPermission()
        return permission === "granted"
    } catch (error) {
        console.warn("Failed to request notification permission:", error)
        return false
    }
}

export async function sendNotification(title: string, options?: NotificationOptions) {
    // SSR safety check
    if (typeof window === "undefined") {
        return
    }

    if (!("Notification" in window) || Notification.permission !== "granted") {
        return
    }

    try {
        // Try using Service Worker notifications first (required on mobile)
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
            const registration = await navigator.serviceWorker.ready
            await registration.showNotification(title, {
                icon: "/favicon.ico",
                ...options
            })
        } else {
            // Fallback to regular Notification API (works on desktop)
            // Wrap in try-catch as mobile browsers throw on `new Notification()`
            try {
                new Notification(title, {
                    icon: "/favicon.ico",
                    ...options
                })
            } catch (e) {
                // Mobile browser - Notification constructor not allowed
                // Silently fail since we can't show notifications without SW
                console.warn("Notifications require Service Worker on this device")
            }
        }
    } catch (error) {
        console.warn("Failed to send notification:", error)
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
