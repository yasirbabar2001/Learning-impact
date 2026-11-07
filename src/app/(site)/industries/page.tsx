import type { Metadata } from "next";
import { IndustriesExplorer } from "@/components/IndustriesExplorer";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { INDUSTRIES } from "@/lib/industries";

export const metadata: Metadata = {
  title: "Industry Training",
  description:
    "Sector-specific corporate training for banking, Islamic finance, telecom, pharma, FMCG, manufacturing, energy, public sector and more than 60 industries, on-site or live online worldwide.",
  alternates: { canonical: "/industries" },
};

export default function IndustriesPage() {
  return (
    <>
      <PageHero eyebrow="Industry & sector training" title="Training that speaks your" highlight="industry.">
        <p>
          Every sector has its own regulations, risks and customers. Find yours among {INDUSTRIES.length} industries below, see the learning areas teams in your
          sector usually ask for, and book training shaped around them.
        </p>
      </PageHero>
      <section className="container section section--tight">
        <Reveal>
          <IndustriesExplorer />
        </Reveal>
      </section>
    </>
  );
}
