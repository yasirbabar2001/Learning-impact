export type Platform = "ios" | "android" | "desktop";

export const STEPS: Record<Platform, { title: string; icon: string; steps: string[] }> = {
  android: {
    title: "Android",
    icon: "🤖",
    steps: ["Open learningimpact.pk in Chrome.", "Tap the ⋮ menu (top right).", "Tap “Install app” or “Add to Home screen”.", "Tap Install. The app appears with your other apps."],
  },
  ios: {
    title: "iPhone & iPad",
    icon: "🍎",
    steps: ["Open learningimpact.pk in Safari.", "Tap the Share button (the square with an arrow ⬆️).", "Scroll down and tap “Add to Home Screen”.", "Tap Add. Open Learning Impact from your Home Screen."],
  },
  desktop: {
    title: "Windows & Mac",
    icon: "💻",
    steps: ["Open learningimpact.pk in Chrome or Edge.", "Click the install icon ⊕ at the right of the address bar.", "Click Install.", "Learning Impact opens in its own window and gets a desktop / Start menu shortcut."],
  },
};

export function InstallSteps({ platform }: { platform: Platform }) {
  const s = STEPS[platform];
  return (
    <ol className="appsteps">
      {s.steps.map((t, i) => (
        <li key={i}>
          <span className="appsteps__n">{i + 1}</span>
          {t}
        </li>
      ))}
    </ol>
  );
}

