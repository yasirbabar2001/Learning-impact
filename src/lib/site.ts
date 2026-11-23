export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://learningimpact.pk").replace(/\/$/, "");
export const SITE_NAME = "Learning Impact";

/** WhatsApp number behind the floating "Live chat" button (international format, digits only). */
export const LIVE_CHAT_WHATSAPP = "923007955559";

/** Brand tagline, shown under the logo in the headers and footer (in parts so it can wrap neatly). */
export const TAGLINE = ["Learn Today.", "Lead Tomorrow.", "Transform Forever."] as const;

export const NAV_LINKS = [
  { href: "/certifications", label: "Certifications" },
  { href: "/programs", label: "Programs" },
  { href: "/industries", label: "Industries" },
  { href: "/contact", label: "Contact" },
] as const;

/** The pop-up menu under "Programs" in the header: the three kinds of training we offer. */
export const PROGRAMS_MENU = [
  { href: "/certifications?view=skills#quests", icon: "⚔️", label: "Skills quests", note: "Capacity building & technical certifications" },
  { href: "/regulatory", icon: "🌍", label: "Regulatory quests", note: "Banking compliance training, country by country" },
  { href: "/programs", icon: "🏢", label: "Corporate training programs", note: "Book a ready-to-run program for your team" },
] as const;

/** The header's highlighted call to action (shown as a button, not a plain link). */
export const HIRE_LINK = { href: "/trainers", label: "Hire a Trainer" } as const;

/** Extra links shown only in the mobile menu. */
export const MOBILE_EXTRA_LINKS = [
  { href: "/certifications?view=skills#quests", label: "Skills quests" },
  { href: "/regulatory", label: "Regulatory quests" },
  { href: "/about", label: "About" },
  { href: "/book", label: "Book corporate training" },
] as const;

export const ENGAGEMENTS = ["Workshop", "Multi-day course", "Training series", "Coaching", "Keynote / talk"] as const;
export const LANGUAGES = ["English", "Urdu", "English & Urdu"] as const;

export const VENUE_TYPES = [
  { value: "At our premises", note: "Your office, training room or branch" },
  { value: "External venue we will book", note: "Hotel or venue arranged by you" },
  { value: "Learning Impact to arrange", note: "We source and book a suitable venue" },
] as const;
export const PLATFORMS = ["Microsoft Teams", "Zoom", "Google Meet", "No preference"] as const;
export const AUDIENCE_LEVELS = ["Entry level / new hires", "Officers & executives", "Middle management", "Senior leadership", "Mixed group"] as const;
export const TIMINGS = ["Weekdays", "Weekends", "Flexible"] as const;
export const EXTRAS = [
  "Training needs assessment",
  "Pre & post assessment",
  "Participant certificates",
  "Printed workbooks",
  "Post-training report",
  "Refreshments & lunch",
] as const;
