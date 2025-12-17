"use client"

import * as React from "react"
import { motion } from "framer-motion"

const QUOTES = [
    "The secret of getting ahead is getting started.",
    "It always seems impossible until it is done.",
    "Focus is the key to all success.",
    "Do it for your future self.",
    "One step at a time.",
    "Flow is the state of total immersion.",
    "Deep work is the superpower of the 21st century.",
    "Distraction is the enemy of progress."
]

export function FocusQuote({ active }: { active: boolean }) {
    const [quote, setQuote] = React.useState(QUOTES[0])

    React.useEffect(() => {
        // Change quote every time session activates or periodically
        setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])
    }, [active])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: active ? 0.8 : 0.4 }}
            className="text-center max-w-lg mt-8"
        >
            <p className="text-lg md:text-xl font-light italic text-muted-foreground/80 font-serif">
                "{quote}"
            </p>
        </motion.div>
    )
}
