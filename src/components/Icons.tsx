type P = { size?: number };
const svg = (size: number, children: React.ReactNode) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const IconBuilding = ({ size = 22 }: P) => svg(size, <><path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16" /><path d="M15 9h4a1 1 0 0 1 1 1v11" /><path d="M8 8h3M8 12h3M8 16h3M3 21h18" /></>);
export const IconScreen = ({ size = 22 }: P) => svg(size, <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /><circle cx="12" cy="10" r="2" /></>);
export const IconHybrid = ({ size = 22 }: P) => svg(size, <><rect x="2" y="5" width="12" height="9" rx="1.5" /><path d="M5 18h6M8 14v4" /><path d="M17 8h3a1 1 0 0 1 1 1v11h-6V12" /><path d="M18 12h1M18 15h1" /></>);
export const IconSpark = ({ size = 22 }: P) => svg(size, <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />);
export const IconTarget = ({ size = 22 }: P) => svg(size, <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></>);
export const IconChart = ({ size = 22 }: P) => svg(size, <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>);
export const IconUsers = ({ size = 22 }: P) => svg(size, <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6" /></>);
export const IconGlobe = ({ size = 22 }: P) => svg(size, <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>);
export const IconBook = ({ size = 22 }: P) => svg(size, <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5M8 7h7" /></>);
export const IconMic = ({ size = 22 }: P) => svg(size, <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>);
export const IconShield = ({ size = 22 }: P) => svg(size, <><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" /><path d="m9 12 2 2 4-4" /></>);
export const IconClock = ({ size = 22 }: P) => svg(size, <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);

export const FORMAT_ICONS = { onsite: <IconBuilding />, virtual: <IconScreen />, hybrid: <IconHybrid /> };
