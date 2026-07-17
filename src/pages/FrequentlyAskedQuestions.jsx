import React, { useEffect, useMemo, useState } from "react";
import { FiBookmark, FiChevronDown, FiChevronUp, FiSearch } from "react-icons/fi";
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
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [openFaqIds, setOpenFaqIds] = useState(() => new Set());
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);


  useEffect(() => {
    const controller = new AbortController();

    async function loadFaqs() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        if (search) {
          params.set("search", search);
        }

        const response = await getJson(`/faqs?${params.toString()}`, {
          signal: controller.signal,
        });
        setFaqs(getRows(response));
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(requestError.message);
          setFaqs([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadFaqs();

    return () => controller.abort();
  }, [search]);

  const visibleFaqs = useMemo(() => {
    return [...faqs].sort((left, right) => {
      const leftOrder = getSortOrder(left, 0);
      const rightOrder = getSortOrder(right, 0);
      if (leftOrder !== rightOrder) return leftOrder - rightOrder;
      return String(left.question || "").localeCompare(String(right.question || ""));
    });
  }, [faqs]);

  const allExpanded =
    visibleFaqs.length > 0 &&
    visibleFaqs.every((faq, index) => openFaqIds.has(getFaqKey(faq, index)));

  const toggleFaq = (faq, index) => {
    const faqKey = getFaqKey(faq, index);
    setOpenFaqIds((current) => {
      const next = new Set(current);
      if (next.has(faqKey)) {
        next.delete(faqKey);
      } else {
        next.add(faqKey);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (allExpanded) {
      setOpenFaqIds(new Set());
      return;
    }

    setOpenFaqIds(
      new Set(visibleFaqs.map((faq, index) => getFaqKey(faq, index))),
    );
  };

  return (
    <main className="bg-[#f7f8f6] px-5 py-12 text-[#253b32] md:px-8">
      <section className="mx-auto max-w-5xl">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c8102e]">
          Homeowner resources
        </p>
        <h1 className="mt-3 text-4xl font-bold text-[#0a4d2c] md:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[#5f6d64]">
          Find answers to common HOA Nightmares questions, submission workflow,
          attorney directory usage, and review process basics.
        </p>

        <div className="mt-8 flex items-center rounded-lg border border-[#d8ddd5] bg-white px-4 shadow-sm">
          <FiSearch className="text-[#6f7a72]" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpenFaqIds(new Set());
            }}
            placeholder="Search FAQs"
            className="w-full bg-transparent p-3 outline-none"
          />
        </div>

        {error && (
          <p className="mt-6 rounded border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700">
            {error}
          </p>
        )}

        <div className="mt-8 rounded-[14px] border border-[#e3e7e1] bg-white p-4 shadow-sm md:p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-[#0a6b3b] text-white">
                <FiBookmark size={16} />
              </span>
              <h2 className="text-lg font-bold text-[#1d2f27]">
                Popular Questions
              </h2>
            </div>

            {visibleFaqs.length > 0 && !isLoading && (
              <button
                type="button"
                onClick={toggleAll}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#0a4d2c] hover:text-black"
              >
                {allExpanded ? "Collapse All" : "Expand All"}
                {allExpanded ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {isLoading && (
              <div
                role="status"
                aria-live="polite"
                className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-lg border border-[#e3e7e1] bg-[#f7f8f6] p-5 text-center font-semibold text-[#0a4d2c]"
              >
                <span
                  aria-hidden="true"
                  className="h-9 w-9 animate-spin rounded-full border-4 border-[#bfd0c5] border-t-[#0a6b3b]"
                />
                <span>Loading FAQs...</span>
              </div>
            )}

            {!isLoading && visibleFaqs.length === 0 && !error && (
              <p className="rounded-lg border border-[#e3e7e1] bg-[#f7f8f6] p-5 text-center font-semibold">
                No published FAQs match your search.
              </p>
            )}

            {!isLoading && visibleFaqs.map((faq, index) => {
              const faqKey = getFaqKey(faq, index);
              const isOpen = openFaqIds.has(faqKey);
              const answerHtml = sanitizeHtml(faq.answer || "");

              return (
                <article
                  key={faqKey}
                  className="overflow-hidden rounded-lg border border-[#e6ebe6] bg-white shadow-sm transition hover:border-[#cfd8cf]"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq, index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left"
                  >
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0a6b3b] text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 font-bold text-[#0a4d2c]">
                      {faq.question}
                    </span>
                    <span className="shrink-0 text-[#2f4251]">
                      {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-[#edf0ed] px-4 pb-5 pl-14 pr-6 text-[#4f5f55]">
                      {faq.category && (
                        <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[#c8102e]">
                          {faq.category}
                        </p>
                      )}
                      <div
                        className="prose prose-neutral mt-3 max-w-none leading-7 [&_a]:font-bold [&_a]:text-[#0a4d2c] [&_p]:mb-3"
                        dangerouslySetInnerHTML={{ __html: answerHtml }}
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
};

export default FrequentlyAskedQuestions;
