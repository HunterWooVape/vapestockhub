import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { siteConfig } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || '';
const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim() || '';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: "VapeStockHub | Global Vape Inventory Marketplace",
  description: "B2B platform for vape inventory, wholesale, and clearance.",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "VapeStockHub | Global Vape Inventory Marketplace",
    description: "B2B platform for vape inventory, wholesale, and clearance.",
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: 'website',
  },
  verification: googleSiteVerification
    ? {
        google: googleSiteVerification,
      }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased bg-background text-foreground`}
    >
      <body className="min-h-full flex flex-col">
        {gaMeasurementId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        ) : null}
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
