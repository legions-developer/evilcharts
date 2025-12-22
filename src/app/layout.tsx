import { JetBrains_Mono, Google_Sans } from "next/font/google";
import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import "./globals.css";

const googleSans = Google_Sans({
  variable: "--font-google-sans",
  subsets: ["latin-ext"],
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
    <html lang="en">
      <body
        className={cn(
          googleSans.variable,
          jetbrainsMono.variable,
          "dark font-sans antialiased",
        )}
      >
        {children}
      </body>
    </html>
  );
}
