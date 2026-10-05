import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import Script from "next/script";

export function Analytics() {
  if (process.env.VERCEL === "1") {
    return <VercelAnalytics />;
  }

  const token = process.env.NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN;
  if (!token) return null;

  return (
    <Script
      id="cloudflare-web-analytics"
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token, spa: true })}
      strategy="afterInteractive"
    />
  );
}
