import type { Metadata } from "next";
import { Doto, JetBrains_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import MicrosoftClarity from "@/providers/microsoft-clarity";
import Analytics from "@/providers/analytics";
import { ThemeProvider } from "next-themes";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { PackageManagerProvider } from "@/contexts/package-manager-context";

const dotoFont = Doto({
  variable: "--font-doto",
  subsets: ["latin"],
});

const jetbrainsMonoFont = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const instrumentSansFont = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Evil Charts - Beautiful & Animated Charts",
  description:
    "Evil Charts is a library of beautiful charts components that are easy to use and customize. It is built with Tailwind CSS and React. Built on top of shadcn/recharts.",
  openGraph: {
    images: ["/banner.png"],
  },
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          dotoFont.variable,
          jetbrainsMonoFont.variable,
          instrumentSansFont.variable,
          "antialiased instrument-sans"
        )}
      >
        <ThemeProvider defaultTheme="system" attribute="class">
          <PackageManagerProvider>
            <MicrosoftClarity />
            <Analytics />
            <VercelAnalytics />
            {children}
          </PackageManagerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
