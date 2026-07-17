import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiSearch } from "react-icons/fi";
import { buildAssetUrl, getJson } from "../lib/api";

const PAGE_SIZE = 9;
const FALLBACK_CATEGORIES = [
  "HOA Disputes",
  "Homeowner Rights",
  "Board Accountability",
  "Legal Updates",
];

function getRows(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.records)) return response.records;
  return [];
}

function getPostIdentifier(post) {
  return post.id || post._id || post.slug || "";
}

function getPostUrl(post) {
  const identifier = getPostIdentifier(post);
  return identifier ? `/blog/${encodeURIComponent(identifier)}` : "/blog";
}

function formatDate(value) {
  if (!value) return "Recently updated";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

const Blog = () => {
  const [posts, setPosts] = useState([]);
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

    async function loadPosts() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      const serverSearch = search || category;

      if (serverSearch) {
        params.set("search", serverSearch);
      }

      try {
        const response = await getJson(`/blogs?${params.toString()}`, {
          signal: controller.signal,
        });
        setPosts(getRows(response));
        setMeta(response.meta || null);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(requestError.message);
          setPosts([]);
          setMeta(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadPosts();

    return () => controller.abort();
  }, [category, page, search]);

  const categories = useMemo(() => {
    const fromPosts = posts
      .map((post) => post.category)
      .filter(Boolean)
      .map((item) => item.trim())
      .filter(Boolean);

    return Array.from(new Set([...FALLBACK_CATEGORIES, ...fromPosts]));
  }, [posts]);

  const visiblePosts = useMemo(() => {
    if (!category) return posts;

    return posts.filter(
      (post) =>
        String(post.category || "").toLowerCase() === category.toLowerCase(),
    );
  }, [category, posts]);

  const totalResults =
    category && search
      ? visiblePosts.length
      : (meta?.totalResults ?? visiblePosts.length);
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
              Published articles
            </p>
            <h1 className="mt-3 text-4xl font-bold text-[#0a4d2c] md:text-5xl">
              HOA Nightmares Blog
            </h1>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-[#5f6d64]">
              Browse articles, updates, and homeowner-focused resources by
              category or keyword.
            </p>
          </div>
          <p className="rounded border border-[#d8ddd5] bg-white px-5 py-3 font-semibold">
            {isLoading
              ? "Loading articles..."
              : `${totalResults} article${totalResults === 1 ? "" : "s"} found`}
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
              placeholder="Search by title, category, tag, or keyword..."
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
          <div className="mb-6 rounded border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            <p className="font-bold">Could not load blog posts.</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        {isLoading && (
          <div
            role="status"
            aria-live="polite"
            className="flex min-h-64 flex-col items-center justify-center gap-3 border border-[#d8ddd5] bg-white p-10 text-center font-semibold text-[#0a4d2c] shadow-sm"
          >
            <span
              aria-hidden="true"
              className="h-10 w-10 animate-spin rounded-full border-4 border-[#bfd0c5] border-t-[#0a6b3b]"
            />
            <span>Loading articles...</span>
          </div>
        )}

        {!isLoading && visiblePosts.length === 0 && !error && (
          <div className="border border-[#d8ddd5] bg-white p-10 text-center shadow-sm">
            <p className="text-xl font-bold text-[#0a4d2c]">
              No published articles match your filters.
            </p>
            <p className="mt-2 text-[#5f6d64]">
              Try a broader keyword or another category.
            </p>
          </div>
        )}

        {!isLoading && visiblePosts.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visiblePosts.map((post) => (
              <article
                key={
                  getPostIdentifier(post) || `${post.title}-${post.category}`
                }
                className="flex h-full flex-col border border-[#d8ddd5] bg-white shadow-sm"
              >
                {post.featured_image ? (
                  <img
                    src={buildAssetUrl(post.featured_image)}
                    alt={post.title || "Blog article"}
                    className="h-52 w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-52 items-center justify-center bg-[#e9eee9] px-6 text-center font-bold text-[#6f7a72]">
                    HOA Nightmares
                  </div>
                )}

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.14em]">
                    {post.category && (
                      <span className="text-[#c8102e]">{post.category}</span>
                    )}
                    <span className="text-[#8b968f]">
                      {formatDate(post.updatedAt || post.createdAt)}
                    </span>
                  </div>

                  <h2 className="mt-3 text-2xl font-bold leading-tight text-[#0a4d2c]">
                    {post.title || "Untitled article"}
                  </h2>
                  <p className="mt-3 flex-1 leading-7 text-[#4f5f55]">
                    {post.excerpt || "Read the full article for more details."}
                  </p>

                  <Link
                    to={getPostUrl(post)}
                    className="mt-5 inline-flex w-fit items-center gap-2 rounded-sm bg-[#0a4d2c] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-black"
                  >
                    Read Article
                    <FiArrowRight />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {!isLoading && totalPages > 1 && (
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-sm border border-[#cfd6cf] bg-white px-4 py-2 font-bold disabled:opacity-45"
            >
              Prev
            </button>
            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              return (
                <button
                  type="button"
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  className={`h-10 w-10 rounded-sm border font-bold ${
                    page === pageNumber
                      ? "border-[#0a4d2c] bg-[#0a4d2c] text-white"
                      : "border-[#cfd6cf] bg-white text-[#273b32]"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              className="rounded-sm border border-[#cfd6cf] bg-white px-4 py-2 font-bold disabled:opacity-45"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </main>
  );
};

export default Blog;
