import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import { StoreProvider } from "@/components/providers/store-provider"
import { SWRProvider } from "@/components/providers/swr-provider"
import { XPProvider } from "@/components/xp-widget"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/components/providers/auth-provider"
import { GamificationProvider } from "@/components/providers/gamification-provider"
import { SmartReminders } from "@/components/smart-reminders"
import { WalkthroughProvider } from "@/components/providers/walkthrough-provider"
import { StarfieldBackground } from "@/components/starfield-background"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Study Board",
  description: "Advanced Student Dashboard",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions)
  let hasSeenWalkthrough = false

  if (session?.user?.id) {
    try {
      const settings = await prisma.userSettings.findUnique({
        where: { userId: session.user.id },
        select: { hasSeenWalkthrough: true }
      })
      hasSeenWalkthrough = !!settings?.hasSeenWalkthrough
    } catch (error) {
      console.warn("Failed to fetch user settings for walkthrough, defaulting to false", error)
    }
  }
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-surface text-on-surface`}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            themes={["light", "dark", "system", "theme-purple", "theme-pink", "theme-pink-dark", "theme-midnight", "theme-forest", "theme-sunset", "theme-cyberpunk", "theme-coffee", "theme-nordic", "theme-cosmic", "theme-retro-pop"]}
          >
            <StarfieldBackground />
            <XPProvider>
              <SWRProvider>
                <StoreProvider>
                  <GamificationProvider>
                    <WalkthroughProvider hasSeenInitial={hasSeenWalkthrough}>
                      {children}
                      <SmartReminders />
                      <Toaster />
                    </WalkthroughProvider>
                  </GamificationProvider>
                </StoreProvider>
              </SWRProvider>
            </XPProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
