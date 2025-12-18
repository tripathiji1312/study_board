import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import { StoreProvider } from "@/components/providers/store-provider"
import { XPProvider } from "@/components/xp-widget"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/components/providers/auth-provider"
import { GamificationProvider } from "@/components/providers/gamification-provider"

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
              <StoreProvider>
                <GamificationProvider>
                  {children}
                  <Toaster />
                </GamificationProvider>
              </StoreProvider>
            </XPProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
