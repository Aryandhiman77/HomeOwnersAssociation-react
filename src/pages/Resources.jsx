import React, { useEffect, useMemo, useState } from "react";
import { FiDownload, FiFileText, FiSearch } from "react-icons/fi";
import PageLoadingSpinner from "../components/PageLoadingSpinner";
import { buildAssetUrl, getJson } from "../lib/api";
import { getRows, sanitizeHtml, stripHtml } from "../lib/content";

const PAGE_SIZE = 9;
const FALLBACK_CATEGORIES = [
  "Guides",
  "Templates",
  "Checklists",
  "HOA Rights",
  "Dispute Help",
];

function getResourceKey(resource) {
  return resource.id || resource._id || resource.slug || resource.title;
}

function getFileUrl(resource) {
  const file = resource?.file;
  if (typeof file === "string") return file;
  return file?.fileUrl || resource?.download_url || resource?.fileUrl || "";
}

function getFileLabel(resource) {
  const file = resource?.file;
  if (typeof file === "string") return "Open file";
  return file?.fileName || "Open resource";
}

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [meta, setMeta] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadResources() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });

      if (search) params.set("keyword", search);
      if (category) params.set("category", category);

      try {
        const response = await getJson(`/resources?${params.toString()}`, {
          signal: controller.signal,
        });
        setResources(getRows(response));
        setMeta(response.meta || null);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(requestError.message);
          setResources([]);
          setMeta(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadResources();

    return () => controller.abort();
  }, [category, page, search]);

  const categories = useMemo(() => {
    const fromResources = resources
      .map((resource) => resource.category)
      .filter(Boolean)
      .map((item) => item.trim())
      .filter(Boolean);

    return Array.from(new Set([...FALLBACK_CATEGORIES, ...fromResources]));
  }, [resources]);

  const totalResults = meta?.totalResults ?? resources.length;
  const totalPages = Math.max(1, meta?.totalPages || 1);

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setCategory("");
    setPage(1);
  };

  return (
    <main className="bg-[#f7f8f6] px-5 py-10 text-[#273b32] md:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c8102e]">
              Resource library
            </p>
            <h1 className="mt-3 text-4xl font-bold text-[#0a4d2c] md:text-5xl">
              Homeowner Resources
            </h1>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-[#5f6d64]">
              Browse published guides, downloads, templates, and homeowner
              education material from the CMS.
            </p>
          </div>
          <p className="rounded-sm border border-[#d8ddd5] bg-white px-5 py-3 font-semibold">
            {isLoading
              ? "Loading resources..."
              : `${totalResults} resource${totalResults === 1 ? "" : "s"} found`}
          </p>
        </div>

        <div className="mb-6 grid gap-4 border border-[#d8ddd5] bg-white p-5 shadow-sm lg:grid-cols-[260px_1fr_auto]">
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
            className="rounded-sm border border-[#cfd6cf] bg-[#f8faf8] p-3 outline-none"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <div className="flex items-center rounded-sm border border-[#cfd6cf] bg-[#f8faf8] px-3">
            <FiSearch className="text-[#6f7a72]" size={20} />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by title, category, summary, or keyword..."
              className="w-full bg-transparent p-3 outline-none"
            />
          </div>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!category && !searchInput}
            className="rounded-sm border border-[#c8102e] px-5 py-3 font-bold text-[#c8102e] disabled:cursor-not-allowed disabled:border-[#d8ddd5] disabled:text-[#9aa39d]"
          >
            Clear
          </button>
        </div>

        {error && (
          <div className="mb-6 border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            <p className="font-bold">Could not load resources.</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        {isLoading && (
          <PageLoadingSpinner
            label="Loading resources..."
            className="border border-[#d8ddd5] bg-white p-10 shadow-sm"
          />
        )}

        {!isLoading && resources.length === 0 && !error && (
          <div className="border border-[#d8ddd5] bg-white p-10 text-center shadow-sm">
            <p className="text-xl font-bold text-[#0a4d2c]">
              No published resources match your filters.
            </p>
            <p className="mt-2 text-[#5f6d64]">
              Try a broader keyword or another category.
            </p>
          </div>
        )}

        {!isLoading && resources.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {resources.map((resource) => {
              const fileUrl = getFileUrl(resource);
              const summary =
                resource.summary ||
                stripHtml(resource.body).slice(0, 180) ||
                "Open this resource for more details.";

              return (
                <article
                  key={getResourceKey(resource)}
                  className="flex h-full flex-col border border-[#d8ddd5] bg-white shadow-sm"
                >
                  {resource.featured_image ? (
                    <img
                      src={buildAssetUrl(resource.featured_image)}
                      alt={resource.title || "Resource"}
                      className="h-52 w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-52 items-center justify-center bg-[#e9eee9] text-5xl text-[#6f7a72]">
                      <FiFileText />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.14em]">
                      {resource.category && (
                        <span className="text-[#c8102e]">{resource.category}</span>
                      )}
                      <span className="text-[#8b968f]">Published</span>
                    </div>

                    <h2 className="mt-3 text-2xl font-bold leading-tight text-[#0a4d2c]">
                      {resource.title || "Untitled resource"}
                    </h2>
                    <p className="mt-3 flex-1 leading-7 text-[#4f5f55]">
                      {summary}
                    </p>

                    {resource.body && (
                      <details className="mt-4 border-t border-[#edf1ee] pt-4">
                        <summary className="cursor-pointer text-sm font-bold uppercase tracking-wide text-[#0a4d2c]">
                          Read summary
                        </summary>
                        <div
                          className="mt-4 leading-7 text-[#4f5f55] [&_a]:font-bold [&_a]:text-[#0a4d2c] [&_p]:mb-4"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeHtml(resource.body),
                          }}
                        />
                      </details>
                    )}

                    {fileUrl && (
                      <a
                        href={buildAssetUrl(fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 inline-flex items-center justify-center gap-2 rounded-sm bg-[#0a4d2c] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-black"
                      >
                        <FiDownload />
                        {getFileLabel(resource)}
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!isLoading && totalPages > 1 && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="rounded-sm border border-[#cfd6cf] bg-white px-4 py-2 font-bold text-[#0a4d2c] disabled:cursor-not-allowed disabled:text-[#9aa39d]"
            >
              Previous
            </button>
            <span className="font-semibold text-[#5f6d64]">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page >= totalPages}
              className="rounded-sm border border-[#cfd6cf] bg-white px-4 py-2 font-bold text-[#0a4d2c] disabled:cursor-not-allowed disabled:text-[#9aa39d]"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </main>
  );
};

export default Resources;
