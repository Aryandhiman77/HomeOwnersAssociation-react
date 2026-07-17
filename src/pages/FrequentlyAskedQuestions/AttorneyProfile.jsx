import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  MdArrowBack,
  MdEmail,
  MdLanguage,
  MdLocalPhone,
  MdLocationOn,
  MdOutlineVerified,
} from "react-icons/md";
import { FaGavel } from "react-icons/fa";
import { getJson } from "../../lib/api";
import { getAttorneyPublicSlug } from "../../lib/attorney";

function getRows(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.records)) return response.records;
  return [];
}

function normalizeWebsite(value) {
  const website = String(value || "").trim();
  if (!website) return "";
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

function formatList(values) {
  if (Array.isArray(values)) return values.filter(Boolean);
  return [values].filter(Boolean);
}

function matchesAttorneyIdentifier(attorney, identifier) {
  if (!attorney || !identifier) return false;

  const publicSlug = getAttorneyPublicSlug(attorney);
  return [attorney.slug, publicSlug, attorney._id, attorney.id]
    .filter(Boolean)
    .some((value) => String(value) === String(identifier));
}

async function fetchPublishedAttorney(identifier, signal) {
  const params = new URLSearchParams({
    page: "1",
    limit: "100",
  });
  const response = await getJson(`/api/public/attorneys?${params}`, {
    signal,
  });
  const attorneys = getRows(response);

  return attorneys.find((attorney) => {
    const publicSlug = getAttorneyPublicSlug(attorney);
    return (
      attorney?.slug === identifier ||
      publicSlug === identifier ||
      attorney?._id === identifier ||
      attorney?.id === identifier
    );
  }) || null;
}

const AttorneyProfile = () => {
  const { slug } = useParams();
  const locationState = useLocation().state;
  const identifier = decodeURIComponent(slug || "");
  const routeAttorney = locationState?.attorney || null;
  const canUseRouteAttorney = matchesAttorneyIdentifier(routeAttorney, identifier);
  const [attorney, setAttorney] = useState(() => (
    canUseRouteAttorney ? routeAttorney : null
  ));
  const [isLoading, setLoading] = useState(!canUseRouteAttorney);
  const [error, setError] = useState("");

  useEffect(() => {
    if (canUseRouteAttorney) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadAttorney() {
      setLoading(true);
      setError("");
      setAttorney(null);

      try {
        const record = await fetchPublishedAttorney(
          identifier,
          controller.signal,
        );

        if (!record) {
          throw new Error("This attorney profile is not published.");
        }

        setAttorney(record);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "Attorney profile not found.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadAttorney();
    return () => controller.abort();
  }, [canUseRouteAttorney, identifier, routeAttorney]);

  const currentAttorney = canUseRouteAttorney ? routeAttorney : attorney;
  const isProfileLoading = canUseRouteAttorney ? false : isLoading;

  const practiceAreas = useMemo(
    () => formatList(currentAttorney?.attorney_practice_areas),
    [currentAttorney],
  );
  const websiteUrl = normalizeWebsite(currentAttorney?.attorney_website);
  const location = [currentAttorney?.attorney_city, currentAttorney?.attorney_state]
    .filter(Boolean)
    .join(", ");

  if (isProfileLoading) {
    return (
      <main className="min-h-screen bg-[#f7f8f6] px-5 py-10 text-[#273b32] md:px-8">
        <section className="mx-auto max-w-5xl border border-[#d8ddd5] bg-white p-8 shadow-sm">
          <div className="animate-pulse">
            <div className="h-5 w-40 bg-[#e6ebe7]" />
            <div className="mt-8 h-12 w-3/4 bg-[#e6ebe7]" />
            <div className="mt-6 h-40 bg-[#eef2ef]" />
          </div>
        </section>
      </main>
    );
  }

  if (error || !currentAttorney) {
    return (
      <main className="min-h-screen bg-[#f7f8f6] px-5 py-12 text-[#273b32] md:px-8">
        <section className="mx-auto max-w-3xl border border-[#d8ddd5] bg-white p-8 text-center shadow-sm">
          <FaGavel className="mx-auto text-[#c8102e]" size={38} />
          <h1 className="mt-4 text-3xl font-bold text-[#0a4d2c]">
            Attorney profile unavailable
          </h1>
          <p className="mt-3 text-[#5f6d64]">
            {error || "This profile is not available right now."}
          </p>
          <Link
            to="/find-attorney"
            className="mt-6 inline-flex items-center gap-2 rounded-sm bg-[#0a4d2c] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-black"
          >
            <MdArrowBack />
            Back to directory
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f6] px-5 py-10 text-[#273b32] md:px-8">
      <article className="mx-auto max-w-6xl border border-[#d8ddd5] bg-white shadow-sm">
        <div className="border-b border-[#d8ddd5] p-6 md:p-8">
          <Link
            to="/find-attorney"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#0a4d2c] underline-offset-4 hover:underline"
          >
            <MdArrowBack />
            Back to attorney directory
          </Link>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded bg-[#eef4f0] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#0a4d2c]">
                <MdOutlineVerified />
                Published attorney profile
              </div>
              <h1 className="mt-4 text-4xl font-bold leading-tight text-[#0a4d2c] md:text-5xl">
                {currentAttorney.attorney_name}
              </h1>
              {currentAttorney.attorney_firm && (
                <p className="mt-3 text-2xl font-semibold text-[#35473d]">
                  {currentAttorney.attorney_firm}
                </p>
              )}
              {location && (
                <p className="mt-4 flex items-center gap-2 text-lg font-semibold text-[#5f6d64]">
                  <MdLocationOn className="text-[#c8102e]" />
                  {location}
                  {currentAttorney.attorney_county ? ` • ${currentAttorney.attorney_county} County` : ""}
                </p>
              )}
            </div>

            <aside className="border border-[#d8ddd5] bg-[#f9faf8] p-5">
              <h2 className="text-lg font-bold text-[#0a4d2c]">
                Contact Information
              </h2>
              <div className="mt-4 space-y-3 text-sm">
                {currentAttorney.attorney_phone && (
                  <a
                    href={`tel:${currentAttorney.attorney_phone}`}
                    className="flex items-center gap-3 font-semibold text-[#35473d] hover:text-[#0a4d2c]"
                  >
                    <MdLocalPhone className="text-[#c8102e]" size={20} />
                    {currentAttorney.attorney_phone}
                  </a>
                )}
                {currentAttorney.attorney_email && (
                  <a
                    href={`mailto:${currentAttorney.attorney_email}`}
                    className="flex items-center gap-3 font-semibold text-[#35473d] hover:text-[#0a4d2c]"
                  >
                    <MdEmail className="text-[#c8102e]" size={20} />
                    {currentAttorney.attorney_email}
                  </a>
                )}
                {websiteUrl && (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 font-semibold text-[#35473d] hover:text-[#0a4d2c]"
                  >
                    <MdLanguage className="text-[#c8102e]" size={20} />
                    Visit website
                  </a>
                )}
              </div>
            </aside>
          </div>
        </div>

        <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[1fr_320px]">
          <section>
            {currentAttorney.attorney_summary && (
              <p className="text-xl leading-8 text-[#4f5f55]">
                {currentAttorney.attorney_summary}
              </p>
            )}
            {currentAttorney.attorney_bio && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-[#0a4d2c]">
                  Attorney Bio
                </h2>
                <p className="mt-3 whitespace-pre-line text-lg leading-8 text-[#35473d]">
                  {currentAttorney.attorney_bio}
                </p>
              </div>
            )}
          </section>

          <aside>
            <h2 className="text-lg font-bold text-[#0a4d2c]">
              Practice Areas
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {practiceAreas.length > 0 ? (
                practiceAreas.map((area) => (
                  <span
                    key={area}
                    className="rounded bg-[#f0f4f1] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#0a4d2c]"
                  >
                    {area}
                  </span>
                ))
              ) : (
                <span className="text-sm text-[#6f7a72]">
                  Practice areas not provided.
                </span>
              )}
            </div>
          </aside>
        </div>
      </article>
    </main>
  );
};

export default AttorneyProfile;
