import React, { useEffect, useMemo, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { Link } from "react-router-dom";
import PageLoadingSpinner from "../components/PageLoadingSpinner";
import { getJson } from "../lib/api";
import { formatDate, normalizeRecord, sanitizeHtml } from "../lib/content";

const LEGAL_CONFIG = {
  privacy: {
    endpoint: "/privacy-policy",
    title: "Privacy Policy",
    eyebrow: "Legal",
    fallback:
      "HOA Nightmares respects your privacy. This page explains how visitor and form information is handled on this website.",
  },
  terms: {
    endpoint: "/terms-of-use",
    title: "Terms of Use",
    eyebrow: "Legal",
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
    <main className="bg-white px-3 py-8 text-black sm:px-5 md:px-8">
      <article className="relative mx-auto my-4 max-w-5xl border border-t-[10px] border-black bg-white px-6 pb-10 pt-14 sm:px-10 md:px-16 md:pb-14 md:pt-16">
        <div className="absolute -top-6 left-5 bg-white px-3 sm:left-12">
          <h1 className="text-2xl font-bold md:text-3xl">{config.title}</h1>
        </div>

        {isLoading ? (
          <PageLoadingSpinner label={`Loading ${config.title.toLowerCase()}...`} />
        ) : (
          <>
            {error && (
              <div className="mt-6 border border-[#ead7a3] bg-[#fff8e5] px-4 py-3 text-sm font-semibold text-[#75520d]">
                CMS content could not be loaded. Showing safe fallback copy.
              </div>
            )}

            <div
              className="my-8 space-y-4 text-lg leading-8 [&_a]:font-bold [&_a]:text-green-800 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-bold [&_li]:ml-6 [&_ol]:list-decimal [&_p]:my-2 [&_ul]:list-disc"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />

            <div className="flex flex-col gap-4 border-t border-black/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-sm bg-[#0a4d2c] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-black"
              >
                <FiArrowLeft />
                Back to Home
              </Link>
              <p className="text-right text-sm font-semibold text-[#6f7a72]">
                Last updated{" "}
                {formatDate(
                  record?.updatedAt || record?.updated_at || record?.createdAt,
                  "Not available",
                )}
              </p>
            </div>
          </>
        )}
      </article>
    </main>
  );
};

export default LegalContentPage;
