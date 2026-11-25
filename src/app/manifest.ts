import type { MetadataRoute } from "next";

/** Makes the site installable as an app on Android, iPhone (Add to Home Screen) and desktop (Chrome / Edge). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Learning Impact",
    short_name: "Learning Impact",
    description: "Gamified certifications, free courses and corporate training. Learn Today. Lead Tomorrow. Transform Forever.",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#050507",
    theme_color: "#050507",
    categories: ["education", "business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "My dashboard", url: "/learn", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Free courses", url: "/certifications?view=free", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "All certifications", url: "/certifications", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
