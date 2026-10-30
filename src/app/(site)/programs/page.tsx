import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { ProgramsExplorer } from "@/components/ProgramsExplorer";
import { Reveal } from "@/components/Reveal";
import { getPublishedPrograms } from "@/lib/data";

export const metadata: Metadata = {
  title: "Training Programs",
  description: "Explore corporate training programs in leadership, communication, sales, digital skills, operations and workplace culture. Book for your team on-site or online.",
  alternates: { canonical: "/programs" },
};

export default async function ProgramsPage() {
  const programs = await getPublishedPrograms();
  return (
    <>
      <PageHero eyebrow="Program catalogue" title="Programs that move" highlight="people forward.">
        <p>Every program can be tailored to your industry and delivered on-site, live online or hybrid. Open any program to see what participants will be able to do.</p>
      </PageHero>
      <section className="container section section--tight">
        {programs.length ? (
          <Reveal>
            <ProgramsExplorer programs={programs} />
          </Reveal>
        ) : (
          <div className="empty glass">
            <h3>Our catalogue is being refreshed.</h3>
            <p className="muted">In the meantime, tell us what you need and we will propose the right program.</p>
            <Link href="/trainers" className="btn btn--primary">
              <span className="btn__label">Request training</span>
              <span className="btn__arrow">→</span>
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
