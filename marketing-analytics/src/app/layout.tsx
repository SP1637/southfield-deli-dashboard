import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Marketing Intelligence — Marketing Analytics",
    template: "%s · Marketing Intelligence",
  },
  description:
    "Connect 18+ marketing sources, get AI-written reports, set KPI alerts and share live dashboards. Built for marketing teams, agencies and e-commerce.",
  keywords: [
    "marketing analytics", "GA4 dashboard", "KPI tracking", "ROAS",
    "sales funnel", "attribution", "AI reports", "marketing agency",
  ],
  openGraph: {
    type: "website",
    siteName: "Marketing Intelligence",
    title: "Marketing Intelligence — Marketing Analytics",
    description:
      "Connect 18+ marketing sources. AI-written reports. KPI alerts. Built for agencies & e-commerce teams.",
    url: "https://marketing-analytics-self.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Marketing Intelligence — Marketing Analytics",
    description: "Connect 18+ marketing sources. AI reports. KPI alerts. Built for agencies & e-commerce teams.",
  },
  metadataBase: new URL(
    process.env.NEXTAUTH_URL ?? "https://marketing-analytics-self.vercel.app"
  ),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Privacy policy link — required for Google OAuth branding verification */}
        <link rel="privacy-policy" href="https://marketing-analytics-self.vercel.app/privacy" />
        {/* Google Tag Manager — loads asynchronously, won't block render */}
        {gtmId && (
          <Script id="gtm-head" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
        )}
      </head>
      <body className={inter.className}>
        {/* GTM noscript fallback */}
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
