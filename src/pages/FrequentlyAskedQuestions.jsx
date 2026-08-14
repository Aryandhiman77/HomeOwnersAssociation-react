import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiFileText,
  FiMail,
  FiMessageCircle,
  FiMinus,
  FiPlus,
  FiSearch,
} from "react-icons/fi";
import DocumentPageHeader from "../components/DocumentPageHeader";
import { getJson } from "../lib/api";
import { sanitizeHtml } from "../lib/content";

function getRows(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.records)) return response.records;
  return [];
}

function getFaqKey(faq, index) {
  return String(faq?._id || faq?.id || faq?.question || index);
}

function getSortOrder(faq, index) {
  const order = Number(faq?.sortOrder ?? faq?.sort_order ?? index + 1);
  return Number.isFinite(order) ? order : index + 1;
}

const FrequentlyAskedQuestions = () => {
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [openFaqKey, setOpenFaqKey] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFaqs() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);

        const response = await getJson(`/faqs?${params.toString()}`, {
          signal: controller.signal,
        });
        const rows = getRows(response);
        setFaqs(rows);

        if (!search) {
          setCategories(
            [...new Set(rows.map((faq) => faq.category).filter(Boolean))].sort(
              (left, right) => left.localeCompare(right),
            ),
          );
        }
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(requestError.message);
          setFaqs([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadFaqs();
    return () => controller.abort();
  }, [search]);

  const visibleFaqs = useMemo(() => {
    return faqs
      .filter(
        (faq) => activeCategory === "All" || faq.category === activeCategory,
      )
      .sort((left, right) => {
        const leftOrder = getSortOrder(left, 0);
        const rightOrder = getSortOrder(right, 0);
        if (leftOrder !== rightOrder) return leftOrder - rightOrder;
        return String(left.question || "").localeCompare(
          String(right.question || ""),
        );
      });
  }, [activeCategory, faqs]);

  const effectiveOpenFaqKey =
    openFaqKey === null && visibleFaqs.length
      ? getFaqKey(visibleFaqs[0], 0)
      : openFaqKey;

  const selectCategory = (category) => {
    setActiveCategory(category);
    setOpenFaqKey(null);
  };

  return (
    <main className="min-h-screen bg-[#fbfcfb] text-[#1e2934]">
      <DocumentPageHeader
        title="Frequently Asked Questions"
        description="HOA Nightmares is a nonprofit resource for homeowners. We share real stories, educational information, attorney-directory resources, and non-legal homeowner advocacy to help you understand your rights and options."
      />
      <section className="mx-auto max-w-[1320px] px-5 pb-12 md:px-8">
        <div className="mt-7 rounded-xl border border-[#dce2dd] bg-white p-2.5 shadow-sm">
          <label className="flex min-w-0 flex-1 items-center rounded-lg border border-[#dce2dd] bg-white px-4">
            <FiSearch className="shrink-0 text-xl text-[#657069]" />
            <span className="sr-only">Search FAQs</span>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpenFaqKey(null);
              }}
              placeholder="Search FAQs..."
              className="w-full bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-[#778078]"
            />
          </label>

          <div
            className="mt-2.5 flex flex-wrap gap-1.5"
            aria-label="Filter FAQs by category"
          >
            {["All", ...categories].map((category) => {
              const isActive = category === activeCategory;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => selectCategory(category)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-bold leading-4 transition ${
                    isActive
                      ? "border-[#075b36] bg-[#075b36] text-white shadow-sm"
                      : "border-[#91b29e] bg-white text-[#17633f] hover:bg-[#eef6f1]"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5 space-y-2.5">
          {isLoading && (
            <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-[#d7e1d9] bg-white font-semibold text-[#075b36]">
              <span className="h-9 w-9 animate-spin rounded-full border-4 border-[#c8d8ce] border-t-[#075b36]" />
              Loading FAQs...
            </div>
          )}

          {!isLoading && visibleFaqs.length === 0 && !error && (
            <p className="rounded-xl border border-[#dce2dd] bg-white p-8 text-center font-semibold">
              No published FAQs match your filters.
            </p>
          )}

          {!isLoading &&
            visibleFaqs.map((faq, index) => {
              const faqKey = getFaqKey(faq, index);
              const isOpen = faqKey === effectiveOpenFaqKey;

              return (
                <article
                  key={faqKey}
                  className={`overflow-hidden rounded-xl border bg-white transition ${
                    isOpen ? "border-[#79a98b] shadow-sm" : "border-[#dce2dd]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqKey(isOpen ? "" : faqKey)}
                    aria-expanded={isOpen}
                    className={`grid w-full grid-cols-[54px_1fr_24px] items-center gap-4 px-4 text-left md:grid-cols-[66px_1fr_28px] md:px-5 ${
                      isOpen ? "pb-1 pt-4" : "py-3"
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center border-r border-[#b9c9bf] text-lg font-extrabold text-[#c8102e] ${
                        isOpen
                          ? "h-14 rounded-full border border-r bg-white shadow-sm"
                          : "h-7"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>
                      {isOpen && faq.category && (
                        <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#c8102e]">
                          {faq.category}
                        </span>
                      )}
                      <span className="block text-base font-extrabold text-[#075b36] md:text-lg">
                        {faq.question}
                      </span>
                    </span>
                    <span className="text-xl font-bold text-[#075b36]">
                      {isOpen ? <FiMinus /> : <FiPlus />}
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      className="prose prose-neutral max-w-none pb-4 pl-[88px] pr-12 text-sm leading-6 text-[#26352e] md:pl-[105px] [&_a]:font-bold [&_a]:text-[#075b36] [&_p:last-child]:mb-0 [&_p]:mb-2"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(faq.answer || ""),
                      }}
                    />
                  )}
                </article>
              );
            })}
        </div>

        <aside className="mt-3 flex flex-col gap-5 rounded-xl border border-[#dce2dd] bg-white px-6 py-4 shadow-sm md:flex-row md:items-center">
          <FiMessageCircle className="shrink-0 text-5xl text-[#075b36]" />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-extrabold text-[#075b36]">
              Still need help?
            </h2>
            <p className="mt-1 text-sm font-medium text-[#34453d]">
              We&apos;re here to support homeowners with resources and guidance.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#075b36] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#06472b]"
            >
              <FiMail /> Contact Us
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
};

export default FrequentlyAskedQuestions;
