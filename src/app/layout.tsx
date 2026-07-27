import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { JetBrains_Mono, Geist, Inter } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { absoluteUrl, cn, SITE_URL } from "@/lib/utils";
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
        url: "/og/og-image.png",
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    creator: "@legionsdev",
    images: ["/og/og-image.png"],
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

// "/" serves the landing page, so entity urls point at the bare origin — the
// canonical 200 URL the sitemap advertises. The #fragment @ids stay anchored to
// the bare origin: they are opaque identifiers, and the docs pages reference
// them cross-page.
const canonicalHome = SITE_URL;

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: canonicalHome,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: canonicalHome,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/web/logo.svg"),
      },
      sameAs: [
        "https://github.com/legions-developer/evilcharts",
        "https://x.com/legionsdev",
      ],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      url: canonicalHome,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      license: "https://github.com/legions-developer/evilcharts/blob/main/LICENSE",
      softwareHelp: { "@type": "CreativeWork", url: absoluteUrl("/docs") },
      author: {
        "@type": "Person",
        name: "Gurbinder",
        url: "https://x.com/legionsdev",
      },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
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
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={cn(
          geist.variable,
          jetbrainsMono.variable,
          inter.variable,
          "font-inter antialiased",
        )}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            // Escape "<" so no value can smuggle in a premature </script>.
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <ThemeProvider defaultTheme="system" attribute="class">
          <VercelAnalytics />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
