export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://learningimpact.pk").replace(/\/$/, "");
export const SITE_NAME = "Learning Impact";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/programs", label: "Programs" },
  { href: "/industries", label: "Industries" },
  { href: "/trainers", label: "Hire a Trainer" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
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
