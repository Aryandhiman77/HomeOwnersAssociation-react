import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaLocationDot } from "react-icons/fa6";
import { FiArrowLeft } from "react-icons/fi";
import { getJson } from "../lib/api";
import { getStoryPublicSlug, getStoryTitle } from "../lib/story";

const FALLBACK_PAGE_LIMIT = 100;

function formatIssueTypes(story) {
  if (Array.isArray(story?.story_issue_type)) return story.story_issue_type;
  return story?.story_issue_type ? [story.story_issue_type] : [];
}

const HoaHorrorStoryDetail = () => {
  const { slug = "" } = useParams();
  const [story, setStory] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadStory() {
      setLoading(true);
      setError("");
      setStory(null);

      try {
        let found = null;

        try {
          const detailResponse = await getJson(
            `/api/public/hoa-horror-stories/${encodeURIComponent(slug)}`,
            { signal: controller.signal },
          );
          found = detailResponse?.data || detailResponse?.record || detailResponse;
        } catch (detailError) {
          if (detailError.name === "AbortError") throw detailError;
        }

        if (!found) {
          const response = await getJson(
            `/api/public/hoa-horror-stories?page=1&limit=${FALLBACK_PAGE_LIMIT}`,
            { signal: controller.signal },
          );
          const rows = Array.isArray(response.data) ? response.data : [];
          found = rows.find((item) => getStoryPublicSlug(item) === slug);
        }

        if (!found) {
          throw new Error("Story not found or not published yet.");
        }

        setStory(found);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(requestError.message);
        }
      } finally {
        setLoading(false);
      }
    }

    loadStory();

    return () => controller.abort();
  }, [slug]);

  const issueTypes = useMemo(() => formatIssueTypes(story), [story]);
  const title = getStoryTitle(story);
  const location = [story?.story_city, story?.story_state]
    .filter(Boolean)
    .join(", ");

  if (isLoading) {
    return (
      <main className="bg-[#f7f8f6] px-5 py-14 text-[#273b32]">
        <section className="mx-auto max-w-4xl border border-[#d8ddd5] bg-white p-8 shadow-sm">
          <p className="font-semibold text-[#5f6d64]">Loading story...</p>
        </section>
      </main>
    );
  }

  if (error || !story) {
    return (
      <main className="bg-[#f7f8f6] px-5 py-14 text-[#273b32]">
        <section className="mx-auto max-w-4xl border border-[#d8ddd5] bg-white p-8 text-center shadow-sm">
          <p className="text-2xl font-bold text-[#0a4d2c]">
            Story not available
          </p>
          <p className="mt-2 text-[#5f6d64]">{error}</p>
          <Link
            to="/hoa-horror-stories"
            className="mt-6 inline-flex items-center gap-2 rounded-sm bg-[#0a4d2c] px-5 py-3 font-bold text-white hover:bg-black"
          >
            <FiArrowLeft />
            Back to stories
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-[#f7f8f6] px-5 py-10 text-[#273b32] md:px-8">
      <article className="mx-auto max-w-5xl border border-[#d8ddd5] bg-white shadow-sm">
        <div className="border-b border-[#d8ddd5] p-6 md:p-10">
          <Link
            to="/hoa-horror-stories"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#0a4d2c] underline-offset-4 hover:underline"
          >
            <FiArrowLeft />
            Back to stories
          </Link>

          <p className="mt-8 text-sm font-bold uppercase tracking-[0.18em] text-[#c8102e]">
            Published homeowner story
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-[#0a4d2c] md:text-5xl">
            {title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-[#5f6d64]">
            {location && (
              <p className="flex items-center gap-2 font-semibold">
                <FaLocationDot className="text-[#c8102e]" />
                {location}
              </p>
            )}
            <p className="font-semibold">
              Submitted by{" "}
              {story.story_anonymous ? "Anonymous" : story.story_name || "Homeowner"}
            </p>
          </div>
        </div>

        <div className="p-6 md:p-10">
          {story.story_hoa_name && (
            <p className="mb-5 rounded-sm border border-[#edf1ee] bg-[#f8faf8] px-4 py-3">
              <span className="font-bold">HOA / Community:</span>{" "}
              {story.story_hoa_name}
            </p>
          )}

          {issueTypes.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2">
              {issueTypes.map((issue) => (
                <span
                  key={issue}
                  className="rounded bg-[#f7e8b5] px-3 py-1.5 text-sm font-bold text-[#5f4a13]"
                >
                  {issue}
                </span>
              ))}
            </div>
          )}

          <div className="prose max-w-none prose-p:leading-8">
            <p className="text-xl leading-9 text-[#35443b]">
              {story.story_body || story.story_summary}
            </p>
          </div>

          {!story.story_body && (
            <p className="mt-8 rounded-sm border border-[#ead7a3] bg-[#fff8e5] px-4 py-3 text-sm font-semibold text-[#75520d]">
              The current public API exposes the approved story summary only.
              Full narrative and uploads can appear here once the backend adds a
              public story detail endpoint for published stories.
            </p>
          )}
        </div>
      </article>
    </main>
  );
};

export default HoaHorrorStoryDetail;
