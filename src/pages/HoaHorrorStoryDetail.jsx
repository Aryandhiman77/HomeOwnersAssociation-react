import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaBookOpen,
  FaBuilding,
  FaCalendarAlt,
  FaCheckCircle,
  FaDownload,
  FaEnvelope,
  FaFile,
  FaFileArchive,
  FaFileExcel,
  FaFilePdf,
  FaFilePowerpoint,
  FaFileVideo,
  FaFileWord,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaPaperclip,
  FaPhone,
  FaRegFileAlt,
  FaShieldAlt,
  FaUser,
} from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import { buildAssetUrl, getJson } from "../lib/api";
import storyHeaderImage from "../assets/images/homeownersFirst.jpg";

const INITIAL_UPLOAD_COUNT = 12;
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp"]);

function formatIssueTypes(story) {
  if (Array.isArray(story?.story_issue_type)) return story.story_issue_type;
  return story?.story_issue_type ? [story.story_issue_type] : [];
}

function formatLabel(value) {
  return String(value || "")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value) {
  if (!value) return "Recently published";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently published";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getFileName(upload, index) {
  if (upload?.fileName) return upload.fileName;

  const source = String(upload?.fileUrl || "").split("?")[0];
  const lastSegment = source.split("/").pop();

  try {
    return decodeURIComponent(lastSegment) || `Attachment ${index + 1}`;
  } catch {
    return lastSegment || `Attachment ${index + 1}`;
  }
}

function getExtension(fileName) {
  return String(fileName || "").split(".").pop()?.toLowerCase() || "";
}

function formatFileSize(value) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return "Size unavailable";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function maskPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length < 4) return "Not provided";
  return `***-***-${digits.slice(-4)}`;
}

function getDocumentIcon(extension, fileType) {
  if (extension === "pdf") {
    return <FaFilePdf className="text-[#d92d20]" aria-hidden="true" />;
  }
  if (["doc", "docx", "odt", "rtf"].includes(extension)) {
    return <FaFileWord className="text-[#2463a9]" aria-hidden="true" />;
  }
  if (["xls", "xlsx", "csv"].includes(extension)) {
    return <FaFileExcel className="text-[#18864b]" aria-hidden="true" />;
  }
  if (["ppt", "pptx"].includes(extension)) {
    return <FaFilePowerpoint className="text-[#d65a31]" aria-hidden="true" />;
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
    return <FaFileArchive className="text-[#8a6427]" aria-hidden="true" />;
  }
  if (
    fileType === "video" ||
    ["mp4", "mov", "avi", "webm", "mkv"].includes(extension)
  ) {
    return <FaFileVideo className="text-[#7149a8]" aria-hidden="true" />;
  }
  if (["txt", "md"].includes(extension)) {
    return <FaRegFileAlt className="text-[#4d6475]" aria-hidden="true" />;
  }
  return <FaFile className="text-[#64748b]" aria-hidden="true" />;
}

function UploadCard({ upload, index }) {
  const fileName = getFileName(upload, index);
  const extension = getExtension(fileName);
  const fileUrl = buildAssetUrl(upload?.fileUrl || "");
  const isImage =
    upload?.fileType === "image" || IMAGE_EXTENSIONS.has(extension);
  const typeLabel = extension ? extension.toUpperCase() : "FILE";
  const displayName = `Supporting evidence ${index + 1}`;
  const downloadName = `supporting-evidence-${index + 1}${
    extension ? `.${extension}` : ""
  }`;

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-[#d8ddd5] bg-white shadow-sm">
      {isImage && fileUrl ? (
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="relative block h-32 overflow-hidden bg-[#eef2ef]"
          aria-label={`Open ${displayName}`}
        >
          <img
            src={fileUrl}
            alt={displayName}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
          />
        </a>
      ) : (
        <div className="flex h-32 items-center justify-center bg-[#f7f9f8] text-6xl">
          {getDocumentIcon(extension, upload?.fileType)}
        </div>
      )}

      <div className="flex min-w-0 items-center gap-3 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[#273b32]">
            {displayName}
          </p>
          <p className="mt-1 text-xs text-[#6b7a71]">
            {typeLabel} · {formatFileSize(upload?.fileSize)}
          </p>
        </div>
        {fileUrl && (
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            download={downloadName}
            aria-label={`Download ${displayName}`}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#9bb7a5] text-[#0a6b3b] transition-colors hover:bg-[#eaf4ed]"
          >
            <FaDownload aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  );
}

function DetailRow({ icon, label, children }) {
  return (
    <div className="grid grid-cols-[24px_1fr] gap-x-3 border-b border-[#e5e9e6] py-3 last:border-0 sm:grid-cols-[24px_1fr_1.1fr]">
      <span className="mt-0.5 text-[#23734a]">{icon}</span>
      <span className="font-bold text-[#405047]">{label}</span>
      <span className="col-start-2 mt-1 min-w-0 break-words text-[#536159] sm:col-start-3 sm:mt-0">
        {children}
      </span>
    </div>
  );
}

const HoaHorrorStoryDetail = () => {
  const { slug = "" } = useParams();
  const [story, setStory] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleUploadCount, setVisibleUploadCount] = useState(
    INITIAL_UPLOAD_COUNT,
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadStory() {
      setLoading(true);
      setError("");
      setStory(null);
      setVisibleUploadCount(INITIAL_UPLOAD_COUNT);

      try {
        const response = await getJson(
          `/hoa-horror-stories/${encodeURIComponent(slug)}`,
          { signal: controller.signal },
        );
        const found = response?.data || response?.record || response;

        if (!found) {
          throw new Error("Story not found or not published yet.");
        }

        setStory(found);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(
            requestError.message || "Story not found or not published yet.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadStory();

    return () => controller.abort();
  }, [slug]);

  const issueTypes = useMemo(() => formatIssueTypes(story), [story]);
  const uploads = Array.isArray(story?.story_uploads)
    ? story.story_uploads
    : [];
  const visibleUploads = uploads.slice(0, visibleUploadCount);
  const storyTitle = story?.story_hoa_name || story?.story_summary || "HOA Story";
  const author =
    story?.story_anonymous || !story?.story_name
      ? "Anonymous Homeowner"
      : story.story_name;
  const location = [story?.story_city, story?.story_state]
    .filter(Boolean)
    .join(", ");

  if (isLoading) {
    return (
      <main className="bg-[#f7f8f6] px-5 py-14 text-[#273b32]">
        <section
          role="status"
          aria-live="polite"
          className="mx-auto flex min-h-72 max-w-4xl flex-col items-center justify-center gap-4 rounded-xl border border-[#d8ddd5] bg-white p-8 shadow-sm"
        >
          <span
            aria-hidden="true"
            className="h-11 w-11 animate-spin rounded-full border-4 border-[#bfd0c5] border-t-[#0a6b3b]"
          />
          <p className="font-semibold text-[#0a4d2c]">Loading story...</p>
        </section>
      </main>
    );
  }

  if (error || !story) {
    return (
      <main className="bg-[#f7f8f6] px-5 py-14 text-[#273b32]">
        <section className="mx-auto max-w-4xl rounded-xl border border-[#d8ddd5] bg-white p-8 text-center shadow-sm">
          <p className="text-2xl font-bold text-[#0a4d2c]">
            Story not available
          </p>
          <p className="mt-2 text-[#5f6d64]">{error}</p>
          <Link
            to="/hoa-horror-stories"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#0a4d2c] px-5 py-3 font-bold text-white hover:bg-black"
          >
            <FiArrowLeft aria-hidden="true" />
            Back to stories
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-[#f7f8f6] text-[#273b32]">
      <header
        className="bg-cover bg-right bg-no-repeat px-4 py-7 text-white md:px-8"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(3, 78, 43, 0.98) 0%, rgba(3, 78, 43, 0.94) 55%, rgba(3, 78, 43, 0.82) 100%), url(${storyHeaderImage})`,
        }}
      >
        <div className="mx-auto max-w-7xl">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-sm text-white/80"
          >
            <Link to="/" className="hover:text-white hover:underline">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              to="/hoa-horror-stories"
              className="hover:text-white hover:underline"
            >
              HOA Horror Stories
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-white">{storyTitle}</span>
          </nav>
          <h1 className="mt-5 text-3xl font-bold md:text-4xl">
            HOA Horror Story
          </h1>
          <p className="mt-2 font-semibold text-white/90">
            Real stories. Real homeowners. Real nightmares.
          </p>
        </div>
      </header>

      <div className="px-4 py-8 md:px-8">
        <div className="mx-auto mb-4 max-w-7xl">
          <Link
            to="/hoa-horror-stories"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#0a4d2c] hover:underline"
          >
            <FiArrowLeft aria-hidden="true" />
            Back to stories
          </Link>
        </div>

        <div className="mx-auto grid max-w-7xl items-start gap-5 xl:grid-cols-[1.65fr_0.95fr]">
        <article className="rounded-xl border border-[#d8ddd5] bg-white p-6 shadow-sm md:p-8">
          <div className="border-b border-[#dfe5e0] pb-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <h1 className="text-3xl font-bold leading-tight text-[#0a4d2c] md:text-4xl">
                {storyTitle}
              </h1>
              <span className="w-fit rounded-lg bg-[#dff3e4] px-4 py-2 font-bold text-[#176b37]">
                Published
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm text-[#536159]">
              <span className="inline-flex items-center gap-2">
                <FaUser className="text-[#23734a]" aria-hidden="true" />
                Submitted by: <strong>{author}</strong>
              </span>
              {location && (
                <span className="inline-flex items-center gap-2">
                  <FaMapMarkerAlt
                    className="text-[#23734a]"
                    aria-hidden="true"
                  />
                  {location}
                </span>
              )}
              <span className="inline-flex items-center gap-2">
                <FaCalendarAlt className="text-[#23734a]" aria-hidden="true" />
                {formatDate(story.createdAt)}
              </span>
            </div>

            {issueTypes.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-sm font-bold">Issue Type:</span>
                {issueTypes.map((issue) => (
                  <span
                    key={issue}
                    className="rounded-md bg-[#e4f2e8] px-3 py-1.5 text-xs font-bold text-[#176b37]"
                  >
                    {formatLabel(issue)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <section className="border-b border-[#dfe5e0] py-6">
            <h2 className="flex items-center gap-3 text-xl font-bold text-[#0a4d2c]">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0a4d2c] text-white">
                <FaRegFileAlt aria-hidden="true" />
              </span>
              Story Summary
            </h2>
            <p className="mt-4 whitespace-pre-wrap pl-0 leading-7 text-[#405047] md:pl-[52px]">
              {story.story_summary}
            </p>
          </section>

          <section className="border-b border-[#dfe5e0] py-6">
            <h2 className="flex items-center gap-3 text-xl font-bold text-[#0a4d2c]">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0a4d2c] text-white">
                <FaBookOpen aria-hidden="true" />
              </span>
              Full Story
            </h2>
            <p className="mt-4 whitespace-pre-wrap pl-0 leading-8 text-[#35443b] md:pl-[52px]">
              {story.story_body || story.story_summary}
            </p>
          </section>

          <section className="pt-6">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <h2 className="flex items-center gap-3 text-xl font-bold text-[#0a4d2c]">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0a4d2c] text-white">
                    <FaPaperclip aria-hidden="true" />
                  </span>
                  Uploads / Supporting Evidence
                </h2>
                <p className="mt-2 text-sm text-[#5f6d64] sm:ml-[52px]">
                  Supporting documents, photos, and other evidence submitted by
                  the author.
                </p>
              </div>
              {uploads.length > 0 && (
                <span className="text-sm font-semibold text-[#5f6d64]">
                  Showing {Math.min(visibleUploadCount, uploads.length)} of{" "}
                  {uploads.length}
                </span>
              )}
            </div>

            {uploads.length === 0 ? (
              <p className="mt-5 rounded-lg bg-[#f7f9f8] px-4 py-5 text-sm text-[#647168]">
                No supporting files were included with this story.
              </p>
            ) : (
              <>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleUploads.map((upload, index) => (
                    <UploadCard
                      key={`${upload.fileUrl || upload.fileName}-${index}`}
                      upload={upload}
                      index={index}
                    />
                  ))}
                </div>

                {visibleUploadCount < uploads.length && (
                  <div className="mt-5 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleUploadCount((current) => current + 12)
                      }
                      className="rounded-md border border-[#0a4d2c] px-5 py-2.5 text-sm font-bold text-[#0a4d2c] hover:bg-[#eaf4ed]"
                    >
                      Show more files
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          <div className="mt-8 flex items-center gap-3 rounded-lg bg-[#eef6f0] px-4 py-3 text-sm font-semibold text-[#23734a]">
            <FaShieldAlt className="shrink-0" aria-hidden="true" />
            This story has been reviewed and published in accordance with our
            guidelines.
          </div>
        </article>

        <aside className="space-y-5 xl:sticky xl:top-28">
          <section className="rounded-xl border border-[#d8ddd5] bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-3 text-xl font-bold text-[#0a4d2c]">
              <FaInfoCircle className="text-[#23734a]" aria-hidden="true" />
              Story Details
            </h2>
            <div className="mt-3">
              <DetailRow
                icon={<FaBuilding aria-hidden="true" />}
                label="HOA Name"
              >
                {story.story_hoa_name || "Not provided"}
              </DetailRow>
              <DetailRow
                icon={<FaMapMarkerAlt aria-hidden="true" />}
                label="City"
              >
                {story.story_city || "Not provided"}
              </DetailRow>
              <DetailRow
                icon={<FaMapMarkerAlt aria-hidden="true" />}
                label="State"
              >
                {story.story_state || "Not provided"}
              </DetailRow>
              <DetailRow icon={<FaUser aria-hidden="true" />} label="Anonymous">
                <span className="rounded-full bg-[#eef1f2] px-3 py-1 text-sm font-semibold">
                  {story.story_anonymous ? "Yes" : "No"}
                </span>
              </DetailRow>
              <DetailRow
                icon={<FaCheckCircle aria-hidden="true" />}
                label="Status"
              >
                <span className="rounded-full bg-[#dff3e4] px-3 py-1 text-sm font-semibold text-[#176b37]">
                  Published
                </span>
              </DetailRow>
            </div>
          </section>

          {!story.story_anonymous && (story.story_email || story.story_phone) && (
            <section className="rounded-xl border border-[#d8ddd5] bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-3 text-xl font-bold text-[#0a4d2c]">
                <FaShieldAlt className="text-[#23734a]" aria-hidden="true" />
                Submitter Information
              </h2>
              <div className="mt-4 space-y-4 text-sm">
                {story.story_email && (
                  <p className="flex items-start gap-3">
                    <FaEnvelope
                      className="mt-1 text-[#23734a]"
                      aria-hidden="true"
                    />
                    <span>
                      <strong className="block">Email</strong>
                      {story.story_email}
                    </span>
                  </p>
                )}
                {story.story_phone && (
                  <p className="flex items-start gap-3">
                    <FaPhone
                      className="mt-1 text-[#23734a]"
                      aria-hidden="true"
                    />
                    <span>
                      <strong className="block">Phone</strong>
                      {maskPhone(story.story_phone)}
                    </span>
                  </p>
                )}
              </div>
              <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-[#6a776f]">
                <FaShieldAlt className="mt-0.5 shrink-0" aria-hidden="true" />
                Email is displayed as submitted. Phone numbers remain masked.
              </p>
            </section>
          )}

        </aside>
        </div>
      </div>
    </main>
  );
};

export default HoaHorrorStoryDetail;
