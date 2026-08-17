import React, { useEffect, useMemo, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { Link } from "react-router-dom";
import PageLoadingSpinner from "../components/PageLoadingSpinner";
import DocumentPageHeader from "../components/DocumentPageHeader";
import footerLogo from "../assets/images/footerImage.png";
import { getJson } from "../lib/api";
import { formatDate, normalizeRecord, sanitizeHtml } from "../lib/content";

const LEGAL_CONFIG = {
  privacy: {
    endpoint: "/privacy-policy",
    title: "Privacy Policy",
    eyebrow: "Legal",
    description: " ",
    fallback:
      "HOA Nightmares respects your privacy. This page explains how visitor and form information is handled on this website.",
  },
  terms: {
    endpoint: "/terms-of-use",
    title: "Terms of Use",
    eyebrow: "Legal",
    description: " ",
    fallback:
      "These terms describe visitor responsibilities, acceptable use, disclaimers, and limitations for using HOA Nightmares.",
  },
};

const LegalContentPage = ({ type = "privacy" }) => {
  const config = LEGAL_CONFIG[type] || LEGAL_CONFIG.privacy;
  const [record, setRecord] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadLegalPage() {
      setLoading(true);
      setError("");

      try {
        const response = await getJson(config.endpoint, {
          signal: controller.signal,
        });
        setRecord(normalizeRecord(response));
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(requestError.message);
          setRecord(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadLegalPage();

    return () => controller.abort();
  }, [config.endpoint]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${config.title} | HOA Nightmares`;

    return () => {
      document.title = previousTitle;
    };
  }, [config.title]);

  const bodyHtml = useMemo(
    () => sanitizeHtml(record?.body || config.fallback),
    [config.fallback, record],
  );

  return (
    <main className="bg-[#f7f8f6] text-black">
      <DocumentPageHeader
        title={config.title}
        description={config.description}
        maxWidthClass="max-w-[860px]"
        titleSizeClass="text-[32px] sm:text-[40px]"
      />
      <section className="px-5 pb-10 pt-0 md:px-8">
        <article className="mx-auto max-w-[860px] py-0">
          {isLoading ? (
            <PageLoadingSpinner
              label={`Loading ${config.title.toLowerCase()}...`}
            />
          ) : (
            <>
              {error && (
                <div className="border border-[#ead7a3] bg-[#fff8e5] px-4 py-3 text-sm font-semibold text-[#75520d]">
                  No internet connection.
                </div>
              )}

              <p className="mb-5 text-sm font-semibold text-[#6f7a72]">
                Last updated{" "}
                {formatDate(
                  record?.updatedAt || record?.updated_at || record?.createdAt,
                  "Not available",
                )}
              </p>

              <div className="mb-6 grid items-end gap-5 md:grid-cols-[minmax(0,1fr)_120px]">
                <div
                  className="space-y-3 text-lg leading-7 [&_a]:font-bold [&_a]:text-green-800 [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-bold [&_li]:ml-6 [&_ol]:list-decimal [&_p]:my-1 [&_ul]:list-disc"
                  dangerouslySetInnerHTML={{ __html: bodyHtml }}
                />
                <img
                  src={footerLogo}
                  alt="HOA Nightmares"
                  className="h-auto w-full max-w-[120px] justify-self-end object-contain"
                />
              </div>

              <div className="border-t border-black/10 pt-6">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-sm bg-[#0a4d2c] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-black"
                >
                  <FiArrowLeft />
                  Back to Home
                </Link>
              </div>
            </>
          )}
        </article>
      </section>
    </main>
  );
};

export default LegalContentPage;
