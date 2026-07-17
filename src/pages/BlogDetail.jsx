import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { buildAssetUrl, getJson } from "../lib/api";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

function getRows(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.records)) return response.records;
  return [];
}

function normalizeBlog(response, fallback = null) {
  const record = response?.data || response?.record || response || fallback;
  return record || null;
}

function safelyDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function formatDate(value) {
  if (!value) return "Recently updated";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sanitizeHtml(html) {
  const source = String(html || "");
  const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(source);

  if (!hasHtmlTags) {
    return source
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
      .join("");
  }

  const template = document.createElement("template");
  template.innerHTML = source;
  const blockedTags = new Set([
    "script",
    "style",
    "iframe",
    "object",
    "embed",
    "link",
    "meta",
  ]);

  template.content.querySelectorAll("*").forEach((element) => {
    if (blockedTags.has(element.tagName.toLowerCase())) {
      element.remove();
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();

      if (name.startsWith("on") || value.startsWith("javascript:")) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  return template.innerHTML;
}

async function resolvePublishedBlogBySlug(slug, signal) {
  const params = new URLSearchParams({
    page: "1",
    limit: "10",
    search: slug,
    status: "published",
  });

  const response = await getJson(`/api/admin/blogs?${params.toString()}`, {
    signal,
  });
  const candidates = getRows(response);
  const exact = candidates.find(
    (post) => safelyDecode(post.slug || "") === slug && post.status === "published",
  );

  if (!exact) {
    return null;
  }

  const id = exact.id || exact._id;
  if (!id) {
    return exact;
  }

  try {
    const detailResponse = await getJson(`/blog/${id}`, { signal });
    return normalizeBlog(detailResponse, exact);
  } catch {
    return exact;
  }
}

const BlogDetail = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const identifier = safelyDecode(id || "");

  useEffect(() => {
    const controller = new AbortController();

    async function loadBlog() {
      setLoading(true);
      setError("");
      setBlog(null);

      try {
        let record = null;

        try {
          const response = await getJson(`/blog/${identifier}`, {
            signal: controller.signal,
          });
          record = normalizeBlog(response);
        } catch (requestError) {
          if (requestError.name === "AbortError") {
            throw requestError;
          }

          if (!OBJECT_ID_PATTERN.test(identifier)) {
            record = await resolvePublishedBlogBySlug(
              identifier,
              controller.signal,
            );
          } else {
            throw requestError;
          }
        }

        if (!record) {
          throw new Error("Blog article not found.");
        }

        if (record.status && record.status !== "published") {
          throw new Error("This article is not published.");
        }

        setBlog(record);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "Blog article not found.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadBlog();

    return () => controller.abort();
  }, [identifier]);

  useEffect(() => {
    if (!blog?.title && !blog?.seo_title) return undefined;

    const previousTitle = document.title;
    document.title = `${blog.seo_title || blog.title} | HOA Nightmares`;

    return () => {
      document.title = previousTitle;
    };
  }, [blog]);

  const sanitizedBody = useMemo(() => {
    return sanitizeHtml(blog?.body || blog?.excerpt || "");
  }, [blog]);

  if (isLoading) {
    return (
      <main className="bg-[#f7f8f6] px-5 py-10 text-[#273b32] md:px-8">
        <section className="mx-auto max-w-4xl border border-[#d8ddd5] bg-white p-8 shadow-sm">
          <div className="animate-pulse">
            <div className="h-4 w-32 bg-[#e6ebe7]" />
            <div className="mt-5 h-10 w-3/4 bg-[#e6ebe7]" />
            <div className="mt-6 h-72 bg-[#e6ebe7]" />
            <div className="mt-8 space-y-3">
              <div className="h-4 bg-[#edf1ee]" />
              <div className="h-4 bg-[#edf1ee]" />
              <div className="h-4 w-5/6 bg-[#edf1ee]" />
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (error || !blog) {
    return (
      <main className="bg-[#f7f8f6] px-5 py-12 text-[#273b32] md:px-8">
        <section className="mx-auto max-w-3xl border border-[#d8ddd5] bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c8102e]">
            Blog
          </p>
          <h1 className="mt-3 text-3xl font-bold text-[#0a4d2c]">
            Article unavailable
          </h1>
          <p className="mt-4 leading-7 text-[#5f6d64]">
            {error || "This article could not be loaded."}
          </p>
          <Link
            to="/blog"
            className="mt-6 inline-flex items-center gap-2 rounded-sm bg-[#0a4d2c] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-black"
          >
            <FiArrowLeft />
            Back to Blog
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-[#f7f8f6] px-5 py-10 text-[#273b32] md:px-8">
      <article className="mx-auto max-w-4xl border border-[#d8ddd5] bg-white shadow-sm">
        {blog.featured_image && (
          <img
            src={buildAssetUrl(blog.featured_image)}
            alt={blog.title || "Blog article"}
            className="max-h-[460px] w-full object-cover"
          />
        )}

        <div className="p-6 md:p-10">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-[#c8102e]"
          >
            <FiArrowLeft />
            Blog
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.14em]">
            {blog.category && <span className="text-[#c8102e]">{blog.category}</span>}
            <span className="text-[#8b968f]">
              {formatDate(blog.updatedAt || blog.createdAt)}
            </span>
          </div>

          <h1 className="mt-4 text-4xl font-bold leading-tight text-[#0a4d2c] md:text-5xl">
            {blog.title}
          </h1>

          {blog.excerpt && (
            <p className="mt-5 text-xl leading-8 text-[#4f5f55]">
              {blog.excerpt}
            </p>
          )}

          {Array.isArray(blog.tags) && blog.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {blog.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-[#f0f4f1] px-3 py-1 text-xs font-bold uppercase text-[#0a4d2c]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div
            className="mt-8 space-y-5 text-lg leading-8 text-[#35473d] [&_a]:font-bold [&_a]:text-[#0a4d2c] [&_blockquote]:border-l-4 [&_blockquote]:border-[#c8102e] [&_blockquote]:bg-[#f7f8f6] [&_blockquote]:px-5 [&_blockquote]:py-3 [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:text-[#0a4d2c] [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:text-[#0a4d2c] [&_li]:ml-6 [&_ol]:list-decimal [&_p]:mb-5 [&_ul]:list-disc"
            dangerouslySetInnerHTML={{ __html: sanitizedBody }}
          />
        </div>
      </article>
    </main>
  );
};

export default BlogDetail;
