import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { JetBrains_Mono, Geist, Inter } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { cn, SITE_URL } from "@/lib/utils";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE,
} from "@/globals/constants/site";
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s — Evil Charts",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  keywords: SITE_KEYWORDS,
  authors: [{ name: "Gurbinder", url: "https://x.com/legionsdev" }],
  creator: "Gurbinder",
  publisher: "Evil Charts",
  category: "technology",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/web/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/web/favicon.svg",
    apple: "/web/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Evil Charts — Beautiful & Animated Charts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    creator: "@legionsdev",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  colorScheme: "light dark",
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
          geist.variable,
          jetbrainsMono.variable,
          inter.variable,
          "font-inter antialiased",
        )}
      >
        <ThemeProvider defaultTheme="system" attribute="class">
          <VercelAnalytics />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
