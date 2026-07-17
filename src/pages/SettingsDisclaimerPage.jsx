import React, { useEffect, useMemo, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { Link } from "react-router-dom";
import PageLoadingSpinner from "../components/PageLoadingSpinner";
import { formatDate, sanitizeHtml } from "../lib/content";
import { getSiteSettings } from "../lib/siteSettings";

const DISCLAIMER_CONFIG = {
  legal: {
    title: "Legal Disclaimer",
    field: "disclaimer",
    fallback:
      "The content on this site is for informational purposes only. HOA rules and policies vary by community and may change without notice.",
  },
  attorney: {
    title: "Attorney Disclaimer",
    field: "attorneyDisclaimer",
    fallback:
      "HOA Nightmares is not a law firm and does not provide legal advice. Attorney listings are provided for informational purposes only.",
  },
};

const SettingsDisclaimerPage = ({ type = "legal" }) => {
  const config = DISCLAIMER_CONFIG[type] || DISCLAIMER_CONFIG.legal;
  const [settings, setSettings] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSettingsDisclaimer() {
      setLoading(true);
      setError(false);

      try {
        const nextSettings = await getSiteSettings({ signal: controller.signal });
        setSettings(nextSettings);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(true);
          setSettings(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadSettingsDisclaimer();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${config.title} | HOA Nightmares`;

    return () => {
      document.title = previousTitle;
    };
  }, [config.title]);

  const bodyHtml = useMemo(
    () => sanitizeHtml(settings?.[config.field] || config.fallback),
    [config.fallback, config.field, settings],
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
                Settings content could not be loaded. Showing safe fallback copy.
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
                  settings?.updatedAt ||
                    settings?.updated_at ||
                    settings?.createdAt,
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

export default SettingsDisclaimerPage;
