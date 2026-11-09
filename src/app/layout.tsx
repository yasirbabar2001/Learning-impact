import { CurrencyProbe } from "@/components/CurrencyProbe";
import { IfspaceCard } from "@/components/IfspaceCard";
import { VisitTracker } from "@/components/VisitTracker";
import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import { Aurora } from "@/components/Aurora";
import { Effects } from "@/components/Effects";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";
import "./portal.css";

const display = Outfit({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

const description =
  "Learning Impact offers gamified professional certifications and helps organisations worldwide book corporate training programs and hire expert trainers: leadership, communication, sales, digital skills and more, delivered on-site, live online or hybrid.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} | Professional Certifications & Corporate Training`, template: `%s | ${SITE_NAME}` },
  description,
  applicationName: SITE_NAME,
  keywords: ["professional certification", "online certification", "corporate training", "employee training", "hire a trainer", "leadership training", "AML certification", "corporate training Pakistan"],
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: SITE_NAME, url: SITE_URL, title: SITE_NAME, description, locale: "en_PK" },
  twitter: { card: "summary_large_image", title: SITE_NAME, description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#050507", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <a href="#main" className="skip">
          Skip to content
        </a>
        <Aurora />
        <Effects />
        {children}
        <IfspaceCard />
        <VisitTracker />
        <CurrencyProbe />
      </body>
    </html>
  );
}
