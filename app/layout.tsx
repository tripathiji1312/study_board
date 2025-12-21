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
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions)
  let hasSeenWalkthrough = false

  if (session?.user?.id) {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
      select: { hasSeenWalkthrough: true }
    })
    hasSeenWalkthrough = !!settings?.hasSeenWalkthrough
  }
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
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
