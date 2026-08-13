import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { buildAssetUrl, getJson } from "../lib/api";

function normalizeBlog(response) {
  const record = response?.data || response?.record || response;
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

const BlogDetail = () => {
  const { slug: slugParam } = useParams();
  const [blog, setBlog] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const slug = safelyDecode(slugParam || "");

  useEffect(() => {
    const controller = new AbortController();

    async function loadBlog() {
      setLoading(true);
      setError("");
      setBlog(null);

      try {
        const response = await getJson(`/blog/${encodeURIComponent(slug)}`, {
          signal: controller.signal,
        });
        const record = normalizeBlog(response);

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
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadBlog();

    return () => controller.abort();
  }, [slug]);

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
      <main className="flex min-h-[60vh] items-center bg-[#f7f8f6] px-5 py-12 text-[#273b32] md:px-8">
        <section
          role="status"
          aria-live="polite"
          className="mx-auto flex min-h-72 w-full max-w-4xl flex-col items-center justify-center gap-4 border border-[#d8ddd5] bg-white p-8 text-center shadow-sm"
        >
          <span
            aria-hidden="true"
            className="h-12 w-12 animate-spin rounded-full border-4 border-[#bfd0c5] border-t-[#0a6b3b]"
          />
          <div>
            <p className="text-xl font-bold text-[#0a4d2c]">
              Loading article...
            </p>
            <p className="mt-2 text-sm text-[#5f6d64]">
              Fetching the latest blog details.
            </p>
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
