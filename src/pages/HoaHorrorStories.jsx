import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaLocationDot } from "react-icons/fa6";
import { MdSearch } from "react-icons/md";
import { getJson } from "../lib/api";
import { getStoryPublicSlug, getStoryTitle } from "../lib/story";

const issueTypes = [
  "Fines or Violations",
  "Unfair Fees or Assessments",
  "Board Harassment",
  "Property Damage",
  "Neglect or Unsafe Conditions",
  "Selective Enforcement",
];

const HoaHorrorStories = () => {
  const [stories, setStories] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({
    state: "",
    category: "",
    keyword: "",
  });
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadStories() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: "1",
        limit: "12",
      });

      if (filters.state) params.set("state", filters.state);
      if (filters.category) params.set("category", filters.category);
      if (filters.keyword) params.set("keyword", filters.keyword);

      try {
        const response = await getJson(
          `/api/public/hoa-horror-stories?${params.toString()}`,
          { signal: controller.signal },
        );
        setStories(Array.isArray(response.data) ? response.data : []);
        setMeta(response.meta || null);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(requestError.message);
          setStories([]);
          setMeta(null);
        }
      } finally {
        setLoading(false);
      }
    }

    loadStories();

    return () => controller.abort();
  }, [filters]);

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  return (
    <main className="bg-[#f7f8f6] px-5 py-10 text-[#273b32] md:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c8102e]">
              Published homeowner stories
            </p>
            <h1 className="mt-3 text-4xl font-bold text-[#0a4d2c] md:text-5xl">
              HOA Horror Stories
            </h1>
            <p className="mt-3 max-w-3xl text-lg text-[#5f6d64]">
              Browse approved homeowner submissions by state, issue type, or
              keyword.
            </p>
          </div>
          <p className="rounded border border-[#d8ddd5] bg-white px-5 py-3 font-semibold">
            {isLoading
              ? "Loading stories..."
              : `${meta?.totalResults ?? stories.length} stories found`}
          </p>
        </div>

        <div className="mb-8 grid gap-4 border border-[#d8ddd5] bg-white p-5 shadow-sm md:grid-cols-[180px_260px_1fr]">
          <select
            value={filters.state}
            onChange={(event) => updateFilter("state", event.target.value)}
            className="rounded-sm border border-[#cfd6cf] bg-[#f8faf8] p-3 outline-none"
          >
            <option value="">All states</option>
            <option value="Florida">Florida</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={filters.category}
            onChange={(event) => updateFilter("category", event.target.value)}
            className="rounded-sm border border-[#cfd6cf] bg-[#f8faf8] p-3 outline-none"
          >
            <option value="">All issue types</option>
            {issueTypes.map((issue) => (
              <option key={issue} value={issue}>
                {issue}
              </option>
            ))}
          </select>

          <div className="flex items-center rounded-sm border border-[#cfd6cf] bg-[#f8faf8] px-3">
            <MdSearch className="text-[#6f7a72]" size={22} />
            <input
              value={filters.keyword}
              onChange={(event) => updateFilter("keyword", event.target.value)}
              placeholder="Search by keyword, HOA name, city..."
              className="w-full bg-transparent p-3 outline-none"
            />
          </div>
        </div>

        {error && (
          <p className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700">
            {error}
          </p>
        )}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {!isLoading && stories.length === 0 && !error && (
            <p className="col-span-full border border-[#d8ddd5] bg-white p-8 text-center font-semibold">
              No published stories match the current filters.
            </p>
          )}

          {stories.map((story, index) => (
            <article
              key={`${getStoryPublicSlug(story)}-${index}`}
              className="border border-[#d8ddd5] bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[#0a4d2c]">
                    <Link
                      to={`/hoa-horror-stories/${getStoryPublicSlug(story)}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {getStoryTitle(story)}
                    </Link>
                  </h2>
                  <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#6f7a72]">
                    <FaLocationDot className="text-[#c8102e]" />
                    {[story.story_city, story.story_state].filter(Boolean).join(", ") ||
                      "Location not listed"}
                  </p>
                </div>
                {story.story_anonymous && (
                  <span className="rounded bg-[#f0f4f1] px-2 py-1 text-xs font-bold uppercase text-[#0a4d2c]">
                    Anonymous
                  </span>
                )}
              </div>

              {story.story_hoa_name && (
                <p className="mb-3 text-sm">
                  <span className="font-semibold">HOA:</span>{" "}
                  {story.story_hoa_name}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {(story.story_issue_type || []).map((issue) => (
                  <span
                    key={issue}
                    className="rounded bg-[#f7e8b5] px-2.5 py-1 text-xs font-semibold text-[#5f4a13]"
                  >
                    {issue}
                  </span>
                ))}
              </div>

              <p className="mt-5 text-sm font-semibold text-[#5f6d64]">
                Submitted by {story.story_anonymous ? "Anonymous" : story.story_name}
              </p>

              <Link
                to={`/hoa-horror-stories/${getStoryPublicSlug(story)}`}
                className="mt-5 inline-flex rounded-sm bg-[#0a4d2c] px-4 py-2 text-sm font-bold text-white hover:bg-black"
              >
                Read story
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default HoaHorrorStories;
