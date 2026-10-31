import type { Metadata } from "next";
import { BookingForm } from "@/components/forms/BookingForm";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { getPublishedPrograms } from "@/lib/data";
import { industryBySlug } from "@/lib/industries";

export const metadata: Metadata = {
  title: "Book a Training Program",
  description: "Request a corporate training program for your employees. Choose a program, format and dates, and receive a proposal within one working day.",
  alternates: { canonical: "/book" },
};

export default async function BookPage({ searchParams }: { searchParams: Promise<{ program?: string; industry?: string }> }) {
  const [{ program, industry }, programs] = await Promise.all([searchParams, getPublishedPrograms()]);
  return (
    <>
      <PageHero eyebrow="Book a program" title="Let's plan your" highlight="training.">
        <p>Three short steps. No commitment: we will confirm availability and send a proposal within one working day.</p>
      </PageHero>
      <section className="container section section--tight form-section">
        <Reveal>
          <BookingForm programs={programs.map(({ slug, title, duration, category }) => ({ slug, title, duration, category }))} preselect={program} industry={industryBySlug(industry)?.name} />
        </Reveal>
      </section>
    </>
  );
}
