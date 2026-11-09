import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { getSettings } from "@/lib/data";
import { currentUser, hasAdminAccess, homeFor, isTeamMember } from "@/lib/portal/auth";
import { SITE_NAME, SITE_URL } from "@/lib/site";


export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, user] = await Promise.all([getSettings(), currentUser()]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo-navy.svg`,
    email: settings.email || undefined,
    telephone: settings.phone || undefined,
    areaServed: "PK",
    sameAs: [settings.linkedin, settings.instagram, settings.facebook].filter(Boolean),
  };

  return (
    <>
      {settings.announcement && <div className="announce">{settings.announcement}</div>}
      <Nav account={user ? { home: user.email_verified_at ? homeFor(user) : "/verify-email", admin: hasAdminAccess(user), team: isTeamMember(user) } : null} />
      {children}
      <Footer settings={settings} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
