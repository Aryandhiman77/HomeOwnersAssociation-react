import React, { useEffect, useMemo, useState } from "react";
import { getJson } from "../lib/api";
import { sanitizeHtml } from "../lib/content";

const AboutUs = () => {
  const [cmsContent, setCmsContent] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    getJson("/about-page-content", { signal: controller.signal })
      .then((response) => setCmsContent(response?.data?.content || ""))
      .catch(() => {});

    return () => controller.abort();
  }, []);

  const cmsHtml = useMemo(() => sanitizeHtml(cmsContent), [cmsContent]);

  if (cmsHtml) {
    return (
      <div className="max-w-7xl mx-auto p-3">
        <div className="border border-t-10 border-black h-full mx-5 my-10 relative sm:mx-20 xl:mx-40">
          <div className="bg-white left-5 sm:left-15 px-3 absolute -top-5">
            <h1 className="text-2xl md:text-3xl font-bold">
              About HOA Nightmares
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold italic ">
              Love My Home. Hate My HOA.
            </h2>
          </div>
          <div
            className="px-8 sm:px-18 my-15 sm:my-20 text-lg space-y-4 [&_a]:font-bold [&_a]:text-green-800 [&_h2]:text-2xl [&_h2]:font-bold [&_li]:ml-6 [&_ol]:list-decimal [&_p]:my-2 [&_ul]:list-disc"
            dangerouslySetInnerHTML={{ __html: cmsHtml }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-3">
      <div className="border border-t-10 border-black h-full mx-5 my-10 relative sm:mx-20  xl:mx-40">
        <div className="bg-white left-5 sm:left-15 px-3 absolute -top-5">
          <h1 className="text-2xl md:text-3xl font-bold">
            About HOA Nightmares
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold italic ">
            Love My Home. Hate My HOA.
          </h2>
        </div>
        <div className="px-8 sm:px-18 my-15 sm:my-20 text-lg ">
          <div className="space-y-2">
            <p>
              HOA Nightmares was created after I personally experienced neglect
              and nonfeasance by my Homeowners Association in Volusia County,
              Florida. What began as a simple maintenance issue became something
              much larger — a situation that revealed how difficult it can be
              for homeowners to obtain fair treatment, even while paying the
              same association fees as their neighbors.
            </p>
            <p>
              The property showed visible deterioration. The lawn and
              surrounding areas were not being maintained. Requests were made.
              Photos were taken. Communications were sent.
            </p>
          </div>
          <p className="my-2 font-semibold">Nothing changed.</p>
          <p className="mt-2">
            Meanwhile, neighboring properties continued to receive maintenance.
            The contrast became obvious. One property was maintained, another
            was not — yet both homeowners paid the same HOA fees.
          </p>
          <p className="font-semibold">
            The expectation was simple: fair and consistent maintenance.
          </p>
          <div>
            <p className="mt-2">
              Instead of resolution, the situation escalated. The issue shifted
              from fixing the problem to managing procedure.
            </p>
            <p className="font-semibold">
              The HOA acknowledged the problem existed, but then considered the
              matter closed. Later email communication was blocked.
            </p>
          </div>
          <div>
            <p className="my-2">At that point, everything was documented:</p>
            <ul className="list-none px-10 font-semibold">
              <li>Evidence was collected</li>
              <li>Photos were saved</li>
              <li>Timelines were created</li>
              <li>Correspondence was preserved</li>
            </ul>
          </div>
          <p className="my-2">
            This experience revealed something important: once a dispute reaches
            this point, homeowners often feel alone. Many do not know where to
            turn. Others hesitate to speak publicly. There was no central place
            for homeowners to document what was happening
          </p>
          <div className="my-2 font-semibold">
            HOA Nightmares was created to give homeowners that voice
          </div>
          <div>
            <p className="my-2 font-semibold">A Larger Problem</p>
            <p>
              After filing civil action, many homeowners from other communities
              reached out with similar complaints. Their stories reflected a
              common theme — maintenance neglect, selective enforcement,
              communication breakdowns, and disputes that escalate
              unnecessarily.
            </p>
            <div className="space-y-2">
              <p>
                This is not an isolated issue. In many cases, HOA governance has
                become increasingly difficult for homeowners to challenge.
                Legislative attention in Florida reflects these growing
                concerns.
              </p>
              <p>
                Florida State Representative Juan Carlos Porras introduced House
                Bill 657, which proposed allowing homeowners to dissolve their
                HOA with support from only 20% of homeowners and to create a
                specialized court system to resolve disputes more efficiently.
                Whether ultimately enacted or not, the bill reflects the growing
                recognition that homeowners need better tools to address HOA
                conflicts
              </p>
              <p>
                Additionally, Florida House Bill 1203, effective July 2024,
                established mandatory education requirements for HOA board
                members, including certification and continuing education. These
                reforms further acknowledge the importance of proper governance
                and accountability.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-semibold">Our Mission:</p>
            <p className="font-semibold">
              HOA Nightmares exists to provide a serious platform for homeowners
              to:
            </p>
            <ul className="list-none px-10 font-semibold">
              <li>Document HOA failures</li>
              <li>Share property eviden</li>
              <li>Preserve timelines</li>
              <li>Show communication history</li>
              <li>Identify patterns across communities</li>
              <li>Connect homeowners with resources</li>
            </ul>
            <p>
              This platform is not about emotional complaints. It is about
              documented experiences supported by evidence
            </p>
            <p className="font-semibold">A Voice for Homeowners</p>
            <p>
              HOA Nightmares was created with the spirit of the First Amendment
              — giving homeowners a voice. The goal is transparency,
              accountability, and awareness. When stories are shared and
              evidence is visible, patterns become clear and homeowners are no
              longer isolated
            </p>
            <p>
              Many associations function properly and serve their communities
              well. This platform is not anti-HOA. However, when an association
              fails to maintain property, applies rules unevenly, or allows
              problems to persist, homeowners need a place to be heard.
            </p>
            <p>HOA Nightmares provides that place.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
