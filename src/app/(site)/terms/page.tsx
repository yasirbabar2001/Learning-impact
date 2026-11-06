import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = { title: "Terms of use and certification rules", alternates: { canonical: "/terms" } };

const SECTIONS = [
  {
    h: "Your account",
    p: [
      "Each account is for one person. Keep your password private; you are responsible for activity on your account.",
      "Use your real name: it is printed on your certificates exactly as entered in your profile.",
    ],
  },
  {
    h: "Payments and access",
    p: [
      "Certifications are paid by bank transfer or mobile wallet. Access starts once we confirm your payment, normally within one working day.",
      "Company seats can be assigned to employees by the company's account manager. A seat is used when an employee accepts the invitation.",
      "Fees are not refundable once a certification has been started, except where required by law.",
    ],
  },
  {
    h: "Session tests and final exam",
    p: [
      "Each session ends with a test. You need 7 out of 10 to unlock the next session, and you may retake session tests.",
      "The final exam is timed and draws a different set of questions for each attempt. The pass mark is shown before you start. You have three attempts; further attempts may be granted at our discretion.",
      "The exam must be your own work: no help from other people, shared answers or impersonation. Copying or sharing exam questions is not allowed.",
    ],
  },
  {
    h: "Certificates",
    p: [
      "Passing the final exam issues a certificate with a unique code that anyone can verify on learningimpact.pk.",
      "We may revoke a certificate obtained through misconduct.",
    ],
  },
  {
    h: "Your data",
    p: [
      "We use your details to run your account, issue certificates and, for company-sponsored learners, to share progress and results with your company's account manager.",
      "Showing on the public leaderboard (first name and initial only) is optional and can be switched off in your profile.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHero eyebrow="Learner terms" title="Terms of use and" highlight="certification rules." />
      <section className="container section section--tight prose-page">
        {SECTIONS.map((s) => (
          <div key={s.h} className="prose-block">
            <h2 className="h3">{s.h}</h2>
            {s.p.map((t) => (
              <p key={t} className="muted">
                {t}
              </p>
            ))}
          </div>
        ))}
      </section>
    </>
  );
}
