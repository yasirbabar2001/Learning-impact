export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://learningimpact.pk").replace(/\/$/, "");
export const SITE_NAME = "Learning Impact";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/programs", label: "Programs" },
  { href: "/trainers", label: "Hire a Trainer" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const ENGAGEMENTS = ["Workshop", "Multi-day course", "Training series", "Coaching", "Keynote / talk"] as const;
export const LANGUAGES = ["English", "Urdu", "English & Urdu"] as const;
