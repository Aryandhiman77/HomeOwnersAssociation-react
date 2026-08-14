import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiCheckCircle,
  FiRefreshCw,
  FiSearch,
  FiShield,
} from "react-icons/fi";
import { getJson } from "../lib/api";
import { getStoryPublicSlug } from "../lib/story";
import { US_STATE_OPTIONS } from "../lib/usLocationData";
import storyHeaderImage from "../assets/images/homeownersFirst.jpg";

const PAGE_SIZE = 12;
const PAGINATION_BUTTON_LIMIT = 6;
const ISSUE_TYPES = [
  "fines or violations",
  "unfair fees or assessments",
  "board harassment",
  "property damage",
  "neglect or unsafe conditions",
  "selective enforcement",
];

const EMPTY_FILTERS = {
  state: "",
  category: "",
  tag: "",
};

function formatLabel(value) {
  return String(value || "")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getStoryAuthor(story) {
  return story.story_anonymous || !story.story_name
    ? "Anonymous Homeowner"
    : story.story_name;
}

const HoaHorrorStories = () => {
  const [stories, setStories] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setKeyword(keywordInput.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [keywordInput]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadStories() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });

      if (filters.state) params.set("state", filters.state);
      if (filters.category) params.set("category", filters.category);
      if (filters.tag) params.set("tag", filters.tag);
      if (keyword) params.set("keyword", keyword);

      try {
        const response = await getJson(
          `/hoa-horror-stories?${params.toString()}`,
          { signal: controller.signal },
        );
        setStories(Array.isArray(response?.data) ? response.data : []);
        setMeta(response?.meta || null);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "Could not load horror stories.");
          setStories([]);
          setMeta(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadStories();

    return () => controller.abort();
  }, [filters, keyword, page]);

  const totalPages = Math.max(1, meta?.totalPages || 1);
  const totalResults = meta?.totalResults ?? stories.length;
  const hasFilters = Boolean(
    keywordInput || filters.state || filters.category || filters.tag,
  );

  const pageNumbers = useMemo(() => {
    const visibleCount = Math.min(PAGINATION_BUTTON_LIMIT, totalPages);
    const maximumStart = Math.max(1, totalPages - visibleCount + 1);
    const start = Math.min(
      Math.max(1, page - Math.floor(visibleCount / 2)),
      maximumStart,
    );

    return Array.from({ length: visibleCount }, (_, index) => start + index);
  }, [page, totalPages]);

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setKeywordInput("");
    setKeyword("");
    setPage(1);
  };

  return (
    <main className="bg-[#f7f8f6] text-[#273b32]">
      <header
        className="bg-cover bg-right bg-no-repeat px-4 py-7 text-white md:px-8"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(3, 78, 43, 0.98) 0%, rgba(3, 78, 43, 0.94) 55%, rgba(3, 78, 43, 0.82) 100%), url(${storyHeaderImage})`,
        }}
      >
        <div className="mx-auto max-w-[1800px]">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-sm text-white/80"
          >
            <Link to="/" className="hover:text-white hover:underline">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-white">HOA Horror Stories</span>
          </nav>
          <h1 className="mt-5 text-3xl font-bold md:text-4xl">
            HOA Horror Stories
          </h1>
          <p className="mt-2 font-semibold text-white/90">
            Real stories. Real homeowners. Real nightmares.
          </p>
        </div>
      </header>

      <section className="px-4 py-8 md:px-8">
        <div className="mx-auto max-w-[1800px]">
          <div className="mb-5 grid gap-3 rounded-2xl border border-[#d8ddd5] bg-white p-4 shadow-sm lg:grid-cols-[1.5fr_repeat(3,0.8fr)_auto]">
            <label className="flex items-center rounded-md border border-[#cfd6cf] bg-white px-3">
              <FiSearch
                className="shrink-0 text-[#0a6b3b]"
                aria-hidden="true"
              />
              <span className="sr-only">Search stories</span>
              <input
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                placeholder="Search stories..."
                className="w-full bg-transparent px-3 py-2.5 outline-none"
              />
            </label>

            <select
              value={filters.state}
              onChange={(event) => updateFilter("state", event.target.value)}
              aria-label="Filter by state"
              className="rounded-md border border-[#cfd6cf] bg-white px-3 py-2.5 outline-none"
            >
              <option value="">All states</option>
              {US_STATE_OPTIONS.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>

            <select
              value={filters.category}
              onChange={(event) => updateFilter("category", event.target.value)}
              aria-label="Filter by category"
              className="rounded-md border border-[#cfd6cf] bg-white px-3 py-2.5 outline-none"
            >
              <option value="">All categories</option>
              {ISSUE_TYPES.map((issue) => (
                <option key={issue} value={issue}>
                  {formatLabel(issue)}
                </option>
              ))}
            </select>

            <select
              value={filters.tag}
              onChange={(event) => updateFilter("tag", event.target.value)}
              aria-label="Filter by tag"
              className="rounded-md border border-[#cfd6cf] bg-white px-3 py-2.5 outline-none"
            >
              <option value="">All tags</option>
              {ISSUE_TYPES.map((issue) => (
                <option key={issue} value={issue}>
                  {formatLabel(issue)}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasFilters}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap px-3 py-2.5 text-sm font-bold text-[#c8102e] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear Filters
              <FiRefreshCw aria-hidden="true" />
            </button>
          </div>

          <div className="mb-4 flex items-center justify-between text-sm text-[#5f6d64]">
            <p>
              {isLoading
                ? "Loading published stories..."
                : `${totalResults} ${totalResults === 1 ? "story" : "stories"} found`}
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-red-700">
              <p className="font-bold">Could not load horror stories.</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          )}

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
            <div>
              {isLoading && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-xl border border-[#d8ddd5] bg-white p-8 shadow-sm"
                >
                  <span
                    aria-hidden="true"
                    className="h-11 w-11 animate-spin rounded-full border-4 border-[#bfd0c5] border-t-[#0a6b3b]"
                  />
                  <p className="font-bold text-[#0a4d2c]">Loading stories...</p>
                </div>
              )}

              {!isLoading && !error && stories.length === 0 && (
                <div className="rounded-xl border border-[#d8ddd5] bg-white p-10 text-center shadow-sm">
                  <h2 className="text-xl font-bold text-[#0a4d2c]">
                    No stories match these filters
                  </h2>
                  <p className="mt-2 text-[#5f6d64]">
                    Clear one or more filters and try again.
                  </p>
                </div>
              )}

              {!isLoading && stories.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {stories.map((story, index) => {
                    const slug = getStoryPublicSlug(story);
                    const issues = Array.isArray(story.story_issue_type)
                      ? story.story_issue_type
                      : [story.story_issue_type].filter(Boolean);

                    return (
                      <article
                        key={`${slug}-${index}`}
                        className="flex min-h-56 flex-col rounded-xl border border-[#d8ddd5] bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h2 className="text-lg font-bold text-[#0a4d2c]">
                            {getStoryAuthor(story)}
                          </h2>
                          <span className="rounded-md bg-[#dff3e4] px-2.5 py-1 text-xs font-bold text-[#176b37]">
                            Published
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-[#5f6d64]">
                          {[story.story_city, story.story_state]
                            .filter(Boolean)
                            .join(", ") || "Location not listed"}
                          {story.story_hoa_name
                            ? `  |  ${story.story_hoa_name}`
                            : ""}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {issues.map((issue) => (
                            <span
                              key={issue}
                              className="rounded-md bg-[#fde8eb] px-2.5 py-1 text-xs font-semibold text-[#c8102e]"
                            >
                              {formatLabel(issue)}
                            </span>
                          ))}
                        </div>

                        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-[#36483e]">
                          {story.story_summary ||
                            "Read this homeowner's experience with their HOA."}
                        </p>

                        <div className="mt-4 flex justify-end text-sm">
                          <Link
                            to={`/hoa-horror-stories/${slug}`}
                            className="inline-flex items-center gap-2 whitespace-nowrap font-bold text-[#0a6b3b] hover:text-black"
                          >
                            Read Full Story
                            <FiArrowRight aria-hidden="true" />
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {!isLoading && !error && totalPages > 1 && (
                <nav
                  className="mt-6 flex flex-wrap justify-center gap-2"
                  aria-label="Story pagination"
                >
                  {pageNumbers.map((pageNumber) => (
                    <button
                      type="button"
                      key={pageNumber}
                      onClick={() => setPage(pageNumber)}
                      aria-current={page === pageNumber ? "page" : undefined}
                      className={`h-10 min-w-10 rounded-md border px-3 font-bold ${
                        page === pageNumber
                          ? "border-[#0a4d2c] bg-[#0a4d2c] text-white"
                          : "border-[#cfd6cf] bg-white text-[#273b32]"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => current + 1)}
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-[#cfd6cf] bg-white px-4 font-bold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <FiArrowRight aria-hidden="true" />
                  </button>
                </nav>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HoaHorrorStories;
