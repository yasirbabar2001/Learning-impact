import { catalog, regulatoryCatalog } from "@/lib/courses/catalog";
import { getPublishedPrograms } from "@/lib/data";
import { currentUser } from "@/lib/portal/auth";
import { TARGETS } from "@/lib/regulatory/targets";
import { TrainingsBarClient, type TrainingGroup } from "./TrainingsBarClient";

/**
 * The bar under the header: "All trainings" opens a searchable list of every training we offer (skills quests,
 * regulatory quests by country and corporate programs), with quick links and a "Suggest a training" button.
 */
export async function TrainingsBar() {
  const [programs, user] = await Promise.all([getPublishedPrograms(), currentUser()]);
  const skills = catalog();
  const regulatory = regulatoryCatalog().filter((q) => q.available);
  const countries = TARGETS.map((t) => ({ name: t.name, quests: regulatory.filter((q) => q.jurisdiction === t.code) })).filter((c) => c.quests.length);

  const groups: TrainingGroup[] = [
    {
      id: "skills",
      title: "Skills certification quests",
      icon: "⚔️",
      href: "/certifications?view=skills#quests",
      sections: [
        {
          items: skills.map((c) => ({ title: c.title, href: `/certifications/${c.slug}`, note: c.available ? c.category : "Coming soon" })),
        },
      ],
    },
    {
      id: "regulatory",
      title: "Regulatory compliance quests",
      icon: "🌍",
      href: "/regulatory",
      sections: countries.map((c) => ({
        heading: c.name,
        items: c.quests.map((q) => ({ title: q.title.replace(/^[^|]+\|\s*/, ""), href: `/certifications/${q.slug}`, note: c.name })),
      })),
    },
    {
      id: "programs",
      title: "Corporate training programs",
      icon: "🏢",
      href: "/programs",
      sections: [{ items: programs.map((p) => ({ title: p.title, href: `/book?program=${p.slug}`, note: `${p.category} · ${p.duration}` })) }],
    },
  ];

  return <TrainingsBarClient groups={groups} signedIn={user ? { name: user.name, email: user.email } : null} />;
}
