"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function StarfieldBackground() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null
  if (theme !== "theme-cosmic") return null

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      <div className="stars-small absolute inset-0 bg-[radial-gradient(1px_1px_at_10%_10%,_rgba(255,255,255,0.8)_1px,_transparent_0)] bg-[size:50px_50px] animate-drift-slow opacity-60" />
      <div className="stars-medium absolute inset-0 bg-[radial-gradient(1.5px_1.5px_at_20%_30%,_rgba(255,255,255,0.6)_1px,_transparent_0)] bg-[size:100px_100px] animate-drift-medium opacity-40" />
      <div className="stars-large absolute inset-0 bg-[radial-gradient(2px_2px_at_40%_60%,_rgba(255,255,255,0.4)_1px,_transparent_0)] bg-[size:200px_200px] animate-drift-fast opacity-30" />
      <div className="nebula absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(76,29,149,0.1),_transparent_60%)] animate-pulse-slow" />
    </div>
  )
}
