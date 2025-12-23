import { JetBrains_Mono, Geist, Google_Sans, Inter } from "next/font/google";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { ThemeProvider } from "next-themes";
import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EvilCharts V2",
  description: "EvilCharts is a library for creating charts and graphs.",
  icons: {
    icon: "/web/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(geist.variable, jetbrainsMono.variable, inter.variable, "font-inter antialiased")}>
        <ThemeProvider defaultTheme="system" attribute="class">
          <VercelAnalytics />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
