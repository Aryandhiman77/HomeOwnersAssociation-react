import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  MdSearch, MdKeyboardArrowDown, MdLocationOn,
  MdBookmark, MdOutlineBookmarkBorder, MdGridView, MdList, MdKeyboardArrowRight,
} from "react-icons/md";
import { FaGavel, FaCity } from "react-icons/fa";
import { BsInfoCircleFill, BsCheckCircleFill } from "react-icons/bs";
import { FaRegHandshake } from "react-icons/fa6";
import { GoShieldCheck } from "react-icons/go";
import { PiHouseLight } from "react-icons/pi";
import { Link, useSearchParams } from "react-router-dom";
import { getJson } from "../../lib/api";
import { getAttorneyPublicSlug } from "../../lib/attorney";
import {
  US_STATE_OPTIONS,
  getCitiesForState,
  normalizeUsState,
} from "../../lib/usLocationData";

/* ── practice areas shown in UI ── */
const SAVED_ATTORNEYS_STORAGE_KEY = "hoa_saved_attorneys";

function readSavedAttorneys() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(SAVED_ATTORNEYS_STORAGE_KEY) || "[]",
    );
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getAttorneySaveKey(attorney) {
  return String(attorney?.slug || attorney?.id || attorney?.name || "");
}

function writeSavedAttorneys(records) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    SAVED_ATTORNEYS_STORAGE_KEY,
    JSON.stringify(records),
  );
}

const PRACTICE_AREAS = [
  "HOA & Condo Disputes",
  "Property Damage / Neglect",
  "Selective Enforcement",
  "Mediation & Pre-Suit Help",
];

/* ─────────────────────────────────────────
   Build query string — KEY FIX:
   Never send practice_area when it is empty.
   The backend middleware crashes on an empty
   practice_area string because it tries to use
   it in a query before checking for undefined.
───────────────────────────────────────── */
function buildParams(filters, page = 1) {
  const params = new URLSearchParams({ page: String(page), limit: "12" });
  if (filters.state)        params.set("state",         filters.state);
  if (filters.city)         params.set("city",          filters.city);
  if (filters.keyword)      params.set("keyword",       filters.keyword);
  return params.toString();
}

/* ── map attorney API response → card shape ── */
function toCard(attorney) {
  const name = attorney.attorney_name || "Attorney";
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const practiceArea = Array.isArray(attorney.attorney_practice_areas)
    ? attorney.attorney_practice_areas[0]
    : attorney.attorney_practice_areas;
  const slug = getAttorneyPublicSlug(attorney);

  return {
    id: attorney._id || attorney.id || slug || name,
    name,
    firm:     attorney.attorney_firm     || "Independent Attorney",
    city:     attorney.attorney_city     || "",
    state:    attorney.attorney_state    || "",
    location: [attorney.attorney_city, attorney.attorney_state].filter(Boolean).join(", "),
    initials,
    tag:      practiceArea               || "HOA Attorney",
    desc:     attorney.attorney_summary  || attorney.attorney_bio || "",
    phone:    attorney.attorney_phone    || "",
    website:  attorney.attorney_website  || "",
    slug,
    raw: attorney,
  };
}

function normalizeSavedAttorney(attorney) {
  if (attorney?.raw || attorney?.name) return attorney;
  return toCard(attorney || {});
}

/* ══════════════════════════════════════════
   Main component
══════════════════════════════════════════ */
const AttorneyDirectory = () => {
  const [searchParams] = useSearchParams();
  const [attorneys,  setAttorneys]  = useState([]);
  const [meta,       setMeta]       = useState(null);
  const [isLoading,  setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [page,       setPage]       = useState(1);
  const [viewMode,   setViewMode]   = useState("grid"); // grid | list
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [savedAttorneys, setSavedAttorneys] = useState(readSavedAttorneys);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const [filters, setFilters] = useState({
    state:        normalizeUsState(searchParams.get("state")),
    city:         "",
    practiceArea: "",
    keyword:      "",
  });

  /* debounce keyword so we don't fire on every keystroke */
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const kwTimer = useRef(null);
  const handleKeyword = useCallback((val) => {
    setFilters((f) => ({ ...f, keyword: val }));
    clearTimeout(kwTimer.current);
    kwTimer.current = setTimeout(() => setDebouncedKeyword(val), 400);
  }, []);

  const cityOptions = useMemo(
    () => getCitiesForState(filters.state),
    [filters.state],
  );
  const savedAttorneyKeys = useMemo(
    () => new Set(savedAttorneys.map(getAttorneySaveKey)),
    [savedAttorneys],
  );
  const savedCards = useMemo(
    () => savedAttorneys.map(normalizeSavedAttorney),
    [savedAttorneys],
  );

  const toggleSavedAttorney = useCallback((attorney) => {
    const saveKey = getAttorneySaveKey(attorney);
    if (!saveKey) return;

    setSavedAttorneys((current) => {
      const exists = current.some((item) => getAttorneySaveKey(item) === saveKey);
      const nextRecords = exists
        ? current.filter((item) => getAttorneySaveKey(item) !== saveKey)
        : [
            ...current,
            {
              ...attorney,
              savedAt: new Date().toISOString(),
            },
          ];

      writeSavedAttorneys(nextRecords);
      return nextRecords;
    });
  }, []);


  /* effective filters sent to API */
  const effectiveFilters = useMemo(
    () => ({
      state: filters.state,
      city: filters.city,
      practiceArea: filters.practiceArea,
      keyword: debouncedKeyword,
    }),
    [filters.state, filters.city, filters.practiceArea, debouncedKeyword],
  );

  /* ── fetch with retry (handles Render.com cold starts) ── */
  const retryCount = useRef(0);
  const MAX_RETRIES = 2;

  const fetchAttorneys = useCallback(
    async (signal) => {
      const res = await getJson(
        `/api/public/attorneys?${buildParams(effectiveFilters, page)}`,
        { signal },
      );
      const rows = Array.isArray(res.data) ? res.data : [];
      setAttorneys(rows);
      setMeta(res.meta || null);
      retryCount.current = 0;
      setRetryAttempt(0);
    },
    [effectiveFilters, page],
  );

  useEffect(() => {
    const controller = new AbortController();
    let retryTimer   = null;
    retryCount.current = 0;

    const attempt = async () => {
      setLoading(true);
      setError("");

      try {
        await fetchAttorneys(controller.signal);
      } catch (err) {
        if (err.name === "AbortError") return;

        /* retry on network/proxy/timeout errors — Render cold start can take ~30s */
        if (retryCount.current < MAX_RETRIES) {
          retryCount.current += 1;
          setRetryAttempt(retryCount.current);
          const delay = retryCount.current * 4000; // 4s, 8s
          retryTimer = setTimeout(attempt, delay);
          return; // keep loading spinner on while retrying
        }

        /* all retries exhausted — show a friendly message */
        setError("backend_unavailable");
        setAttorneys([]);
        setMeta(null);
      } finally {
        if (retryCount.current === 0) setLoading(false);
      }
    };

    attempt();

    return () => {
      controller.abort();
      clearTimeout(retryTimer);
    };
  }, [fetchAttorneys]);

  /* reset page on filter change */
  const updateFilter = useCallback((field, value) => {
    setPage(1);
    if (field === "keyword") {
      handleKeyword(value);
      return;
    }

    setFilters((f) => ({
      ...f,
      [field]: value,
      ...(field === "state" ? { city: "" } : {}),
    }));
  }, [handleKeyword]);

  const filteredAttorneys = useMemo(() => {
    if (!filters.practiceArea) return attorneys;

    return attorneys.filter((attorney) => {
      const areas = Array.isArray(attorney.attorney_practice_areas)
        ? attorney.attorney_practice_areas
        : [attorney.attorney_practice_areas].filter(Boolean);
      return areas.some(
        (area) =>
          String(area).toLowerCase() === filters.practiceArea.toLowerCase(),
      );
    });
  }, [attorneys, filters.practiceArea]);
  const cards        = useMemo(() => filteredAttorneys.map(toCard), [filteredAttorneys]);
  const displayCards = showSavedOnly ? savedCards : cards;
  const resultCount  = showSavedOnly
    ? savedCards.length
    : filters.practiceArea
      ? cards.length
      : meta?.totalResults ?? cards.length;
  const totalPages   = showSavedOnly || filters.practiceArea ? 1 : meta?.totalPages   ?? 1;

  return (
    <div className="min-h-screen bg-white p-4 md:p-12 font-sans text-[#333333]">
      <div className="max-w-7xl mx-auto">

        {/* ── Page header ── */}
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-1">
            <h1 className="text-[40px] font-bold text-[#0a4d2c] leading-tight">
              Find a Homeowner Attorney
            </h1>
            <p className="text-[#666666] text-lg">
              Search approved and published attorney listings by location, practice area, and keyword.
            </p>
          </div>

          {/* State indicator */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="text-right">
              <p className="text-[11px] text-[#666666] font-semibold">Searching in</p>
              <p className="text-[28px] font-bold text-[#c8102e] leading-none py-1">
                {filters.state ? filters.state.toUpperCase() : "ALL STATES"}
              </p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f0f4f1] text-[#0a4d2c]">
              <MdLocationOn size={34} />
            </div>
          </div>
        </div>

        {/* ── Location and search filter bar ── */}
        <div className="bg-white rounded-[20px] border border-[#eeeeee] shadow-sm p-7 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          {/* Step 1 — State */}
          <FilterStep
            step={1} label="Select State"
            success={!!filters.state}
            hint={filters.state ? "State selected" : "Choose a state"}
          >
            <select
              value={filters.state}
              onChange={(e) => updateFilter("state", e.target.value)}
              className="w-full p-3 bg-[#f9f9f7] border border-[#dddddd] rounded-lg appearance-none text-[#555555] text-sm focus:outline-none"
            >
              <option value="">All States</option>
              {US_STATE_OPTIONS.map((stateName) => (
                <option key={stateName} value={stateName}>
                  {stateName}
                </option>
              ))}
            </select>
          </FilterStep>

          {/* Step 2 — City */}
          <FilterStep
            step={2} label="Select City / County"
            hint={
              !filters.state
                ? "Choose a state first"
                : filters.city
                  ? "City selected"
                  : `${cityOptions.length} cities available`
            }
            success={!!filters.city}
            divider
          >
            <select
              value={filters.city}
              onChange={(e) => updateFilter("city", e.target.value)}
              disabled={!filters.state}
              className={`w-full p-3 bg-[#f9f9f7] border border-[#dddddd] rounded-lg appearance-none text-[#555555] text-sm focus:outline-none ${
                !filters.state ? "cursor-not-allowed opacity-60" : ""
              }`}
            >
              <option value="">
                {filters.state ? "Any City" : "Select state first"}
              </option>
              {cityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </FilterStep>
          {/* Step 3 - Practice area */}
          <FilterStep
            step={3} label="Type / Practice Area"
            hint={filters.practiceArea ? "Practice area selected" : "Choose a practice area"}
            success={!!filters.practiceArea}
            divider
          >
            <select
              value={filters.practiceArea}
              onChange={(e) => updateFilter("practiceArea", e.target.value)}
              className="w-full p-3 bg-[#f9f9f7] border border-[#dddddd] rounded-lg appearance-none text-[#555555] text-sm focus:outline-none"
            >
              <option value="">All Practice Areas</option>
              {PRACTICE_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </FilterStep>

          {/* Step 4 - Keyword */}
          <FilterStep step={4} label="Keyword Search" hint="Enter keywords (optional)">
            <div className="relative">
              <input
                type="text"
                value={filters.keyword}
                onChange={(e) => updateFilter("keyword", e.target.value)}
                placeholder="Search by keyword..."
                className="w-full p-3 bg-[#f9f9f7] border border-[#dddddd] rounded-lg text-sm focus:outline-none pr-10"
              />
              <MdSearch className="absolute right-3 top-3.5 text-[#999999]" size={20} />
            </div>
          </FilterStep>
        </div>

        {/* ── Practice area quick-filter pills ── */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span className="text-[15px] font-bold text-[#444444] mr-2">Popular Practice Areas</span>

          <PracticeBtn
            icon={<FaCity size={18} />}
            label="HOA & Condo Disputes"
            active={filters.practiceArea === "HOA & Condo Disputes"}
            onClick={() => updateFilter("practiceArea",
              filters.practiceArea === "HOA & Condo Disputes" ? "" : "HOA & Condo Disputes")}
          />
          <PracticeBtn
            icon={<PiHouseLight size={18} />}
            label="Property Damage / Neglect"
            active={filters.practiceArea === "Property Damage / Neglect"}
            onClick={() => updateFilter("practiceArea",
              filters.practiceArea === "Property Damage / Neglect" ? "" : "Property Damage / Neglect")}
          />
          <PracticeBtn
            icon={<GoShieldCheck size={18} />}
            label="Selective Enforcement"
            active={filters.practiceArea === "Selective Enforcement"}
            onClick={() => updateFilter("practiceArea",
              filters.practiceArea === "Selective Enforcement" ? "" : "Selective Enforcement")}
          />
          <PracticeBtn
            icon={<FaRegHandshake size={18} />}
            label="Mediation & Pre-Suit Help"
            active={filters.practiceArea === "Mediation & Pre-Suit Help"}
            onClick={() => updateFilter("practiceArea",
              filters.practiceArea === "Mediation & Pre-Suit Help" ? "" : "Mediation & Pre-Suit Help")}
          />

          {/* Clear filters */}
          {(filters.state || filters.city || filters.practiceArea || filters.keyword) && (
            <button
              type="button"
              onClick={() => { setFilters({ state: "", city: "", practiceArea: "", keyword: "" }); setDebouncedKeyword(""); setPage(1); }}
              className="px-4 py-2 text-[13px] text-[#c8102e] border border-[#c8102e] rounded-full font-semibold hover:bg-red-50 transition"
            >
              Clear filters ✕
            </button>
          )}
        </div>

        {/* ── Results header bar ── */}
        <div className="flex justify-between items-center mb-6 border-b border-[#eeeeee] pb-4">
          <div>
            <h2 className="text-[26px] font-bold text-[#0a4d2c]">
              {isLoading && !showSavedOnly ? "Loading..." : `${resultCount} ${showSavedOnly ? "Saved " : ""}Attorney${resultCount !== 1 ? "s" : ""} Found`}
            </h2>
            <p className="text-[13px] text-[#888888] font-medium">
              {showSavedOnly ? (
                "Showing your saved attorneys"
              ) : (
                <>
                  Showing results for {filters.state || "all states"}
                  {filters.city ? `, ${filters.city}` : ""}
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowSavedOnly((current) => !current)}
              title={showSavedOnly ? "Show all attorneys" : "Show saved attorneys"}
              aria-label={showSavedOnly ? "Show all attorneys" : "Show saved attorneys"}
              className={`relative inline-flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                showSavedOnly
                  ? "border-[#0a4d2c] bg-[#0a4d2c] text-white"
                  : "border-[#dddddd] bg-white text-[#0a4d2c] hover:bg-[#f0f4f1]"
              }`}
            >
              <MdBookmark size={20} />
              {savedAttorneys.length > 0 && (
                <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-[#c8102e] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  {savedAttorneys.length}
                </span>
              )}
            </button>
            <div className="flex bg-[#eeeeee] p-1 rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-[#0a4d2c] text-white" : "text-[#888888]"}`}
              >
                <MdGridView size={22} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-[#0a4d2c] text-white" : "text-[#888888]"}`}
              >
                <MdList size={22} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 rounded-[16px] border border-[#ffd5d5] bg-[#fff5f5] px-6 py-6 text-center">
            <p className="text-[16px] font-bold text-[#c8102e] mb-1">
              Could not load attorneys right now.
            </p>
            <p className="text-[13px] text-[#888888] mb-4">
              The server may be waking up — this usually takes under 30 seconds on first load.
            </p>
            <button
              type="button"
              onClick={() => {
                retryCount.current = 0;
                setRetryAttempt(0);
                setError("");
                setLoading(true);
                getJson(`/api/public/attorneys?${buildParams(effectiveFilters, page)}`)
                  .then((res) => {
                    setAttorneys(Array.isArray(res.data) ? res.data : []);
                    setMeta(res.meta || null);
                    setError("");
                  })
                  .catch(() => setError("backend_unavailable"))
                  .finally(() => setLoading(false));
              }}
              className="inline-flex items-center gap-2 bg-[#0a4d2c] text-white px-6 py-2.5 rounded-lg text-[13px] font-bold hover:bg-black transition-colors"
            >
              ↺ Try Again
            </button>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {isLoading && !showSavedOnly && (
          <div>
            {retryAttempt > 0 && (
              <p className="text-center text-[13px] text-[#888888] mb-4 font-medium">
                Server is warming up, retrying… (attempt {retryAttempt}/{MAX_RETRIES})
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-[15px] border border-[#eeeeee] p-5 animate-pulse">
                  <div className="flex gap-3 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-2 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded mb-2 w-1/3" />
                  <div className="space-y-1">
                    <div className="h-2 bg-gray-100 rounded" />
                    <div className="h-2 bg-gray-100 rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && displayCards.length === 0 && !error && (
          <div className="rounded-[15px] border border-[#eeeeee] bg-[#f9f9f7] p-12 text-center mb-16">
            <FaGavel size={40} className="mx-auto text-[#cccccc] mb-4" />
            <p className="font-bold text-[#555555] text-lg">
              {showSavedOnly ? "No saved attorneys yet." : "No approved attorneys are published for these filters."}
            </p>
            <p className="text-[#888888] text-sm mt-1">
              {showSavedOnly
                ? "Tap the bookmark icon on an attorney card to save it here."
                : "Admin submissions must be approved and published before they appear in this public directory."}
            </p>
          </div>
        )}

        {/* ── Attorney grid/list ── */}
        {!isLoading && displayCards.length > 0 && (
          <div className={`mb-16 ${
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
              : "flex flex-col gap-4"
          }`}>
            {displayCards.map((att) =>
              viewMode === "grid"
                ? <AttorneyCard key={att.id} att={att} isSaved={savedAttorneyKeys.has(getAttorneySaveKey(att))} onToggleSave={toggleSavedAttorney} />
                : <AttorneyRow  key={att.id} att={att} isSaved={savedAttorneyKeys.has(getAttorneySaveKey(att))} onToggleSave={toggleSavedAttorney} />
            )}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && !isLoading && !showSavedOnly && (
          <div className="flex justify-center gap-2 mb-16">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-lg border border-[#dddddd] text-sm font-semibold disabled:opacity-40 hover:bg-[#f9f9f7] transition"
            >
              ← Prev
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-lg text-sm font-bold transition ${
                  page === i + 1
                    ? "bg-[#0a4d2c] text-white"
                    : "border border-[#dddddd] hover:bg-[#f9f9f7]"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-lg border border-[#dddddd] text-sm font-semibold disabled:opacity-40 hover:bg-[#f9f9f7] transition"
            >
              Next →
            </button>
          </div>
        )}

        {/* ── Submit your listing CTA ── */}
        <div className="bg-white rounded-[20px] border border-[#eeeeee] shadow-sm p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="bg-[#0a4d2c] w-16 h-16 rounded-[12px] flex items-center justify-center shrink-0">
              <FaGavel className="text-white" size={32} />
            </div>
            <div>
              <h4 className="font-bold text-xl text-[#333333]">Are You a Homeowner Attorney?</h4>
              <p className="text-[#666666] text-sm mt-1">
                Submit your listing and connect with homeowners who need your help.
              </p>
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              to="/find-attorney/submit"
              className="bg-[#c8102e] text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-black transition-all"
            >
              Submit Your Listing <MdKeyboardArrowRight size={20} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   Sub-components
══════════════════════════════════════════ */

/* Filter step wrapper */
function FilterStep({ step, label, children, hint, success, divider }) {
  return (
    <div className={`relative ${divider ? "md:border-l border-[#eeeeee] md:pl-6" : ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="bg-[#c8102e] text-white w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-bold shrink-0">
          {step}
        </span>
        <span className="font-bold text-[15px]">{label}</span>
      </div>
      <div className="relative">
        {children}
        <MdKeyboardArrowDown className="absolute right-3 top-3.5 text-[#999999] pointer-events-none" size={20} />
      </div>
      <div className={`mt-2 flex items-center gap-1.5 text-[11px] font-medium ${success ? "text-[#0a4d2c]" : "text-[#888888]"}`}>
        {success ? <BsCheckCircleFill size={12} /> : <BsInfoCircleFill size={12} />}
        {hint}
      </div>
    </div>
  );
}

/* Practice area pill button */
function PracticeBtn({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-bold transition ${
        active
          ? "bg-[#0a4d2c] text-white"
          : "bg-white border border-[#cccccc] text-[#444444] hover:bg-gray-50"
      }`}
    >
      <span className={active ? "text-white" : "text-[#888888]"}>{icon}</span>
      {label}
    </button>
  );
}

/* Attorney grid card */
function AttorneyCard({ att, isSaved, onToggleSave }) {
  return (
    <div className="bg-white rounded-[15px] p-5 border border-[#eeeeee] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-[#0a4d2c] w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white text-lg shrink-0">
            {att.initials}
          </div>
          <div className="overflow-hidden">
            <h3 className="font-bold text-[14px] text-[#333333] truncate">{att.name}</h3>
            <p className="text-[11px] text-[#888888] leading-tight truncate">{att.firm}</p>
            {att.location && (
              <p className="text-[11px] text-[#333333] font-bold flex items-center gap-0.5 mt-0.5">
                <MdLocationOn size={12} /> {att.location}
              </p>
            )}
          </div>
        </div>
        {att.tag && (
          <div className="bg-[#f0f4f1] text-[10px] font-bold text-[#0a4d2c] px-2.5 py-1.5 rounded uppercase tracking-wider mb-3 inline-block">
            {att.tag}
          </div>
        )}
        {att.desc && (
          <p className="text-[12px] text-[#555555] leading-relaxed mb-4 line-clamp-3">{att.desc}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Link
          to={`/find-attorney/${att.slug}`}
          state={{ attorney: att.raw || att }}
          className="flex-1 bg-[#0a4d2c] text-white py-2.5 rounded-lg text-[12px] font-bold hover:bg-black transition-colors uppercase tracking-wide text-center"
        >
          View Profile
        </Link>
        <button
          type="button"
          onClick={() => onToggleSave(att)}
          title={isSaved ? "Remove saved attorney" : "Save attorney"}
          aria-label={isSaved ? "Remove saved attorney" : "Save attorney"}
          className={`p-2 border rounded-lg transition-all ${
            isSaved
              ? "border-[#0a4d2c] bg-[#f0f4f1] text-[#0a4d2c]"
              : "border-[#dddddd] text-[#999999] hover:text-[#0a4d2c]"
          }`}
        >
          {isSaved ? <MdBookmark size={20} /> : <MdOutlineBookmarkBorder size={20} />}
        </button>
      </div>
    </div>
  );
}
/* Attorney list row */
function AttorneyRow({ att, isSaved, onToggleSave }) {
  return (
    <div className="bg-white rounded-[12px] p-5 border border-[#eeeeee] shadow-sm flex flex-col gap-5 hover:shadow-md transition-shadow sm:flex-row sm:items-center">
      <div className="bg-[#0a4d2c] w-14 h-14 rounded-lg flex items-center justify-center font-bold text-white text-xl shrink-0">
        {att.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="font-bold text-[15px] text-[#333333]">{att.name}</h3>
          {att.tag && (
            <span className="bg-[#f0f4f1] text-[10px] font-bold text-[#0a4d2c] px-2 py-1 rounded uppercase">
              {att.tag}
            </span>
          )}
        </div>
        <p className="text-[12px] text-[#888888]">{att.firm}</p>
        {att.location && (
          <p className="text-[12px] text-[#555555] flex items-center gap-1 mt-0.5">
            <MdLocationOn size={12} /> {att.location}
          </p>
        )}
        {att.desc && (
          <p className="text-[12px] text-[#777777] mt-1 line-clamp-2">{att.desc}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => onToggleSave(att)}
          title={isSaved ? "Remove saved attorney" : "Save attorney"}
          aria-label={isSaved ? "Remove saved attorney" : "Save attorney"}
          className={`p-2 border rounded-lg transition-all ${
            isSaved
              ? "border-[#0a4d2c] bg-[#f0f4f1] text-[#0a4d2c]"
              : "border-[#dddddd] text-[#999999] hover:text-[#0a4d2c]"
          }`}
        >
          {isSaved ? <MdBookmark size={20} /> : <MdOutlineBookmarkBorder size={20} />}
        </button>
        <Link
          to={`/find-attorney/${att.slug}`}
          state={{ attorney: att.raw || att }}
          className="shrink-0 bg-[#0a4d2c] text-white px-5 py-2.5 rounded-lg text-[12px] font-bold hover:bg-black transition-colors"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}
export default AttorneyDirectory;
