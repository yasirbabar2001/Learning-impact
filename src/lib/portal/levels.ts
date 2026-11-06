/** Levels a learner climbs with XP (shared by server and browser). */
export const LEVELS = [
  { name: "Explorer", xp: 0 },
  { name: "Pathfinder", xp: 300 },
  { name: "Achiever", xp: 800 },
  { name: "Specialist", xp: 1600 },
  { name: "Expert", xp: 3000 },
  { name: "Master", xp: 5000 },
  { name: "Legend", xp: 8000 },
] as const;

export function levelFor(xp: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i++;
  const cur = LEVELS[i];
  const next = LEVELS[i + 1] ?? null;
  const progress = next ? (xp - cur.xp) / (next.xp - cur.xp) : 1;
  return { index: i + 1, name: cur.name, next, progress, toNext: next ? next.xp - xp : 0 };
}
