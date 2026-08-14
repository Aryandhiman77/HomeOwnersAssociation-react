import React, { useEffect } from "react";
import DocumentPageHeader from "../components/DocumentPageHeader";
import footerLogo from "../assets/images/footerImage.png";

const missionPoints = [
  "Document HOA failures",
  "Share property evidence",
  "Preserve timelines",
  "Show communication history",
  "Identify patterns across communities",
  "Connect homeowners with resources",
];

const Mission = () => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Our Mission | HOA Nightmares";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f8f6] text-[#242424]">
      <DocumentPageHeader
        title="Our Mission Brief:"
        maxWidthClass="max-w-[860px]"
      />

      <section className="px-5 pb-12 pt-3 md:px-8">
        <article className="mx-auto max-w-[860px] text-base leading-7">
          <p className="font-bold">
            HOA Nightmares exists to provide a serious platform for homeowners
            to:
          </p>

          <ul className="mt-4 list-disc space-y-1 pl-10 font-bold text-[#00843d] marker:text-[#00843d]">
            {missionPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>

          <div className="my-6 h-px w-12 bg-black/30" aria-hidden="true" />

          <p className="font-serif italic text-[#575757]">
            This platform is not about emotional complaints. It is about
            documented experiences supported by evidence.
          </p>

          <h2 className="mt-7 font-serif text-2xl font-bold text-[#323232]">
            A Voice for Homeowners
          </h2>

          <p className="mt-4">
            HOA Nightmares was created with the spirit of the First Amendment —
            giving homeowners a voice. The goal is transparency,
            accountability, and awareness. When stories are shared and evidence
            is visible, patterns become clear and homeowners are no longer
            isolated.
          </p>

          <p className="mt-5">
            Many associations function properly and serve their communities
            well. This platform is not anti-HOA. However, when an association
            fails to maintain property, applies rules unevenly, or allows
            problems to persist, homeowners need a place to be heard.
          </p>

          <p className="mt-5 font-bold">
            HOA Nightmares provides that place.
          </p>

          <img
            src={footerLogo}
            alt="HOA Nightmares"
            className="mx-auto mt-8 h-auto w-full max-w-[150px] object-contain"
          />
        </article>
      </section>
    </main>
  );
};

export default Mission;
