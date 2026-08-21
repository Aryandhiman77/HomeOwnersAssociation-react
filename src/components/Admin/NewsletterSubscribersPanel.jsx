import React, { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  FiDownload,
  FiMail,
  FiRefreshCw,
  FiSearch,
  FiUserX,
} from "react-icons/fi";
import { getBlob, getJson, patchJson } from "../../lib/api";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getSubscriberId(subscriber) {
  return subscriber?.id || subscriber?._id || "";
}

const NewsletterSubscribersPanel = ({ onCountChange, refreshSignal = 0 }) => {
  const [subscribers, setSubscribers] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState({
    page: 1,
    totalPages: 1,
    totalResults: 0,
  });
  const [isLoading, setLoading] = useState(true);
  const [isExporting, setExporting] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadSubscribers = useCallback(async () => {
    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      status,
    });
    if (search) params.set("search", search);

    try {
      const response = await getJson(
        `/api/admin/newsletter/subscribers?${params.toString()}`,
      );
      const rows = Array.isArray(response?.data) ? response.data : [];
      const nextMeta = {
        page: Number(response?.meta?.page || page),
        totalPages: Math.max(1, Number(response?.meta?.totalPages || 1)),
        totalResults: Number(response?.meta?.totalResults || rows.length),
      };
      setSubscribers(rows);
      setMeta(nextMeta);
      onCountChange?.(nextMeta.totalResults);
    } catch (requestError) {
      setSubscribers([]);
      setError(
        requestError.message || "Newsletter subscribers could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [limit, onCountChange, page, search, status]);

  useEffect(() => {
    let isCurrent = true;
    queueMicrotask(() => {
      if (isCurrent) loadSubscribers();
    });
    return () => {
      isCurrent = false;
    };
  }, [loadSubscribers]);

  useEffect(() => {
    if (refreshSignal > 0) loadSubscribers();
  }, [loadSubscribers, refreshSignal]);

  const exportSubscribers = async () => {
    setExporting(true);
    setError("");
    try {
      const blob = await getBlob("/api/admin/newsletter/subscribers/export");
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = "hoa-newsletter-subscribers.csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (requestError) {
      setError(
        requestError.message || "The subscriber CSV could not be exported.",
      );
    } finally {
      setExporting(false);
    }
  };

  const unsubscribeSubscriber = async (subscriber) => {
    const id = getSubscriberId(subscriber);
    if (!id || subscriber.status !== "subscribed") return;

    const result = await Swal.fire({
      icon: "warning",
      title: "Unsubscribe this subscriber?",
      text: `${subscriber.email} will stop receiving newsletter communications.`,
      showCancelButton: true,
      confirmButtonText: "Unsubscribe",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#c8102e",
    });
    if (!result.isConfirmed) return;

    setBusyId(id);
    setError("");
    try {
      const response = await patchJson(
        `/api/admin/newsletter/subscribers/${encodeURIComponent(id)}/unsubscribe`,
      );
      await Swal.fire({
        icon: "success",
        title: "Subscriber updated",
        text: response?.message || "The subscriber has been unsubscribed.",
        confirmButtonColor: "#405b6d",
      });
      await loadSubscribers();
    } catch (requestError) {
      setError(
        requestError.message || "The subscriber could not be unsubscribed.",
      );
    } finally {
      setBusyId("");
    }
  };

  return (
    <section className="mt-8 overflow-hidden rounded-xl border border-[#d7dadd] bg-white shadow-sm">
      <div className="border-b border-[#d7dadd] p-5">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-semibold text-[#2e4353]">
              <FiMail className="text-[#0a6b3b]" />
              Newsletter Subscribers
            </h2>
            <p className="mt-1 text-sm text-[#6a757d]">
              {meta.totalResults} subscriber{meta.totalResults === 1 ? "" : "s"}
              {status === "all" ? "" : ` matching “${status}”`}
            </p>
          </div>
          <button
            type="button"
            onClick={exportSubscribers}
            disabled={isExporting}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#0a6b3b] px-4 py-2.5 font-bold text-white shadow-sm hover:bg-[#07532f] disabled:cursor-wait disabled:opacity-60"
          >
            {isExporting ? (
              <FiRefreshCw className="animate-spin" />
            ) : (
              <FiDownload />
            )}
            {isExporting ? "Exporting..." : "Export Subscribers to CSV"}
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_220px]">
          <label className="flex items-center rounded-lg border border-[#cfd3d7] bg-white px-3">
            <FiSearch className="text-[#8b949b]" />
            <span className="sr-only">Search subscribers</span>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search first name or email"
              className="w-full px-3 py-2.5 outline-none"
            />
          </label>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            aria-label="Filter subscribers by status"
            className="rounded-lg border border-[#cfd3d7] bg-white px-3 py-2.5 outline-none"
          >
            <option value="all">All statuses</option>
            <option value="subscribed">Subscribed</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="m-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700"
        >
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left">
          <thead className="border-b border-[#d7dadd] bg-[#f7f8f9] text-sm text-[#52616b]">
            <tr>
              <th className="px-5 py-3">#</th>
              <th className="px-5 py-3">Subscriber</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Subscribed</th>
              <th className="px-5 py-3">Unsubscribed</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <span className="inline-flex items-center gap-3 font-semibold text-[#60717c]">
                    <FiRefreshCw className="animate-spin" /> Loading
                    subscribers...
                  </span>
                </td>
              </tr>
            )}
            {!isLoading && subscribers.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-[#6a757d]"
                >
                  No newsletter subscribers match the selected filters.
                </td>
              </tr>
            )}
            {!isLoading &&
              subscribers.map((subscriber, i) => {
                const id = getSubscriberId(subscriber);
                const isSubscribed = subscriber.status === "subscribed";
                return (
                  <tr
                    key={id || subscriber.email}
                    className="border-b border-[#e7eaec] last:border-0"
                  >
                    <td className="px-5 py-4 font-semibold text-[#2e4353]">
                      {i + 1}
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#2e4353]">
                      {subscriber.firstName || "Not provided"}
                    </td>
                    <td className="px-5 py-4 text-[#52616b]">
                      {subscriber.email}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          isSubscribed
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {isSubscribed ? "Subscribed" : "Unsubscribed"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#60717c]">
                      {formatDate(subscriber.subscribedAt)}
                    </td>
                    <td className="px-5 py-4 text-sm text-[#60717c]">
                      {formatDate(subscriber.unsubscribedAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => unsubscribeSubscriber(subscriber)}
                        disabled={!isSubscribed || busyId === id}
                        className="inline-flex items-center gap-2 rounded-md border border-[#c8102e] px-3 py-2 text-sm font-bold text-[#c8102e] hover:bg-red-50 disabled:cursor-not-allowed disabled:border-[#cbd2d6] disabled:text-[#9aa3a8]"
                      >
                        {busyId === id ? (
                          <FiRefreshCw className="animate-spin" />
                        ) : (
                          <FiUserX />
                        )}
                        {isSubscribed ? "Unsubscribe" : "Unsubscribed"}
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-[#d7dadd] p-4 text-sm text-[#405b6d] sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 font-semibold">
          Rows per page
          <select
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setPage(1);
            }}
            className="rounded border border-[#cfd3d7] bg-white px-2 py-1.5"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-3">
          <span className="font-semibold">
            Page {meta.page} of {meta.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || isLoading}
            className="rounded border border-[#cfd3d7] px-3 py-1.5 font-semibold disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() =>
              setPage((current) => Math.min(meta.totalPages, current + 1))
            }
            disabled={page >= meta.totalPages || isLoading}
            className="rounded border border-[#cfd3d7] px-3 py-1.5 font-semibold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSubscribersPanel;
