"use client";

import { usePathname } from "next/navigation";
import { LIVE_CHAT_WHATSAPP } from "@/lib/site";

/**
 * Floating "Live chat" button (bottom right). Signed-in people go straight to a WhatsApp chat with the team, with a
 * short greeting already typed; everyone else is sent to sign up first and brought back afterwards.
 * Hidden inside lessons and exams, where the corner belongs to Ilmi and the lesson controls.
 */
export function LiveChat({ signedIn }: { signedIn: { name: string; email: string } | null }) {
  const path = usePathname() || "/";
  if (/^\/learn\/[^/]+\/[^/]+/.test(path)) return null;

  const label = "Live chat on WhatsApp";
  const icon = (
    <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16 3C9 3 3.3 8.6 3.3 15.6c0 2.2.6 4.4 1.7 6.3L3.2 29l7.3-1.9c1.8 1 3.9 1.5 5.9 1.5 7 0 12.7-5.7 12.7-12.6C29.1 8.6 23.3 3 16 3zm0 23.2c-1.9 0-3.8-.5-5.4-1.5l-.4-.2-4.3 1.1 1.1-4.2-.3-.4a10.4 10.4 0 0 1-1.6-5.5C5.2 9.8 10 5.1 16 5.1s10.8 4.7 10.8 10.5S22 26.2 16 26.2zm5.9-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.5c.2.2 2.4 3.6 5.8 5 .8.4 1.4.6 1.9.7.8.3 1.5.2 2.1.1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.3.2-1.5-.1-.1-.3-.2-.6-.3z"
      />
    </svg>
  );

  if (!signedIn) {
    return (
      <a href={`/register?next=${encodeURIComponent(path)}&chat=1`} className="livechat" aria-label={`${label} (sign up first)`}>
        {icon}
        <span>Live chat</span>
      </a>
    );
  }
  const text = `Hello Learning Impact, I'm ${signedIn.name} (${signedIn.email}). I'd like to chat about your trainings.`;
  return (
    <a href={`https://wa.me/${LIVE_CHAT_WHATSAPP}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className="livechat" aria-label={label}>
      {icon}
      <span>Live chat</span>
    </a>
  );
}
