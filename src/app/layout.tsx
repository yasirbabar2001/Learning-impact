import { IfspaceCard } from "@/components/IfspaceCard";
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
  "Learning Impact helps organisations in Pakistan book corporate training programs and hire expert trainers: leadership, communication, sales, digital skills and more, delivered on-site, live online or hybrid.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} | Corporate Training & Expert Trainers in Pakistan`, template: `%s | ${SITE_NAME}` },
  description,
  applicationName: SITE_NAME,
  keywords: ["corporate training Pakistan", "employee training", "hire a trainer", "leadership training", "soft skills training", "Karachi", "Lahore", "Islamabad"],
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
      </body>
    </html>
  );
}
