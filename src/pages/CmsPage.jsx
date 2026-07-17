import React, { useEffect, useMemo, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { Link } from "react-router-dom";
import { buildAssetUrl, getJson } from "../lib/api";
import {
  formatDate,
  getRecordId,
  getRows,
  normalizeRecord,
  normalizeSlug,
  sanitizeHtml,
} from "../lib/content";

const CmsPage = ({
  slug,
  title,
  description,
  eyebrow = "HOA Nightmares",
}) => {
  const [page, setPage] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadPage() {
      setLoading(true);
      setError("");
      setPage(null);

      const params = new URLSearchParams({
        page: "1",
        limit: "10",
        status: "published",
        search: slug,
      });

      try {
        const response = await getJson(`/api/admin/pages?${params.toString()}`, {
          signal: controller.signal,
        });
        const candidates = getRows(response);
        const exactPage =
          candidates.find((candidate) => normalizeSlug(candidate.slug) === slug) ||
          candidates.find((candidate) => normalizeSlug(candidate.title) === slug) ||
          candidates[0];

        if (!exactPage) {
          throw new Error("CMS page has not been published yet.");
        }

        const id = getRecordId(exactPage);
        if (!id) {
          setPage(exactPage);
          return;
        }

        const detailResponse = await getJson(`/api/admin/page/${id}`, {
          signal: controller.signal,
        });
        setPage(normalizeRecord(detailResponse, exactPage));
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(requestError.message);
        }
      } finally {
        setLoading(false);
      }
    }

    loadPage();

    return () => controller.abort();
  }, [slug]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${page?.seo_title || page?.title || title} | HOA Nightmares`;

    return () => {
      document.title = previousTitle;
    };
  }, [page, title]);

  const heroBodyHtml = useMemo(
    () => sanitizeHtml(page?.hero_body || description || ""),
    [description, page],
  );

  const displayTitle = page?.hero_title || page?.title || title;
  const featuredImage = page?.featured_image ? buildAssetUrl(page.featured_image) : "";

  return (
    <main className="bg-[#f7f8f6] text-[#273b32]">
      <section className="border-b border-[#d8ddd5] bg-white px-5 py-10 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c8102e]">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-[#0a4d2c] md:text-5xl">
              {isLoading ? title : displayTitle}
            </h1>
            <div
              className="mt-5 max-w-3xl text-lg leading-8 text-[#4f5f55] [&_a]:font-bold [&_a]:text-[#0a4d2c] [&_p]:mb-4"
              dangerouslySetInnerHTML={{
                __html: heroBodyHtml || sanitizeHtml(description),
              }}
            />
            <p className="mt-4 text-sm font-semibold text-[#6f7a72]">
              {isLoading
                ? "Loading CMS content..."
                : page?.updatedAt
                  ? `Last updated ${formatDate(page.updatedAt)}`
                  : "Current page content"}
            </p>
          </div>

          {featuredImage ? (
            <img
              src={featuredImage}
              alt={displayTitle}
              className="h-[320px] w-full border border-[#d8ddd5] object-cover shadow-sm"
            />
          ) : (
            <div className="flex min-h-[260px] items-center justify-center border border-[#d8ddd5] bg-[#edf1ee] px-8 text-center text-2xl font-bold text-[#6f7a72] shadow-sm">
              HOA Nightmares
            </div>
          )}
        </div>
      </section>

      <section className="px-5 py-10 md:px-8">
        <div className="mx-auto max-w-4xl border border-[#d8ddd5] bg-white p-6 shadow-sm md:p-10">
          {error && (
            <div className="mb-6 border border-[#ead7a3] bg-[#fff8e5] px-4 py-3 text-sm font-semibold text-[#75520d]">
              CMS content could not be loaded. Showing fallback content.
            </div>
          )}

          <div
            className="prose prose-neutral max-w-none leading-8 text-[#3f4d45] [&_a]:font-bold [&_a]:text-[#0a4d2c] [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#0a4d2c] [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#0a4d2c] [&_li]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-5 [&_ul]:list-disc [&_ul]:pl-6"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(page?.hero_body || description),
            }}
          />

          <Link
            to="/"
            className="mt-8 inline-flex items-center gap-2 rounded-sm bg-[#0a4d2c] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-black"
          >
            <FiArrowLeft />
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
};

export default CmsPage;
