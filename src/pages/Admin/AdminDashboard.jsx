import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiAlertTriangle,
  FiBell,
  FiBookOpen,
  FiChevronDown,
  FiChevronRight,
  FiEdit3,
  FiExternalLink,
  FiEye,
  FiFileText,
  FiGrid,
  FiHelpCircle,
  FiLogOut,
  FiMenu,
  FiMessageSquare,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { FaRegNewspaper } from "react-icons/fa";
import { MdOutlineContactMail, MdOutlineGavel } from "react-icons/md";
import logo from "../../assets/images/footerImage.png";
import { logoutAdminRemote } from "../../lib/adminAuth";
import {
  buildAssetUrl,
  API_BASE_URL,
  deleteJson,
  getJson,
  patchFormData,
  patchJson,
  postFormData,
  postJson,
  putFormData,
  putJson,
} from "../../lib/api";
import RichTextEditor from "../../components/RichTextEditor";
import {
  AboutCmsEditor,
  AdminSettingsEditor,
  AdvocateCmsEditor,
  ContactCmsEditor,
  GenericCmsEditor,
  HomeCmsEditor,
  NotificationsEditor,
} from "../../components/Admin/SingletonEditors";
import {
  normalizeRecord as normalizeApiRecord,
  stripHtml,
} from "../../lib/content";
import {
  buildAboutCmsPayload,
  buildAdvocateCmsFormData,
  buildContactCmsPayload,
  buildGenericCmsFormData,
  buildHomeCmsFormData,
  buildSettingsFormData,
  cmsQueueKeys,
  nonWorkflowQueues,
  normalizeCmsRecord,
  normalizeNotificationRecord,
  normalizeSettingsRecord,
  singletonQueueKeys,
} from "../../lib/adminCmsSettings";
import {
  getLocalQueueRecords,
  isFrontendManagedQueue,
  isLocalQueueMirrorEnabled,
  removeLocalQueueRecord,
  upsertLocalQueueRecord,
} from "../../lib/adminLocalQueues";
import { US_STATE_OPTIONS, getCitiesForState } from "../../lib/usLocationData";

const queueEndpoints = {
  stories: "/api/admin/stories?page=1&limit=50",
  removalRequests:
    "/api/admin/story/removal-requests?page=1&limit=50",
  contact: [
    "/api/admin/contacts?page=1&limit=50",
    "/api/admin/contact/listing?page=1&limit=50",
    "/api/admin/queues/contact",
  ],
  advocate: [
    "/api/admin/non-legal-advocate?page=1&limit=50",
    "/api/admin/non-legal-advocate/listing?page=1&limit=50",
    "/api/admin/queues/advocate",
  ],
  // moderation: [
  //   "/api/admin/moderation?page=1&limit=50",
  //   "/api/admin/moderation/listing?page=1&limit=50",
  // ],
  attorneys: "/api/admin/attorney/listing?page=1&limit=50",
  faqs: "/api/admin/faqs?page=1&limit=50",
  blogs: "/api/admin/blogs?page=1&limit=50",
  pages: "/api/admin/pages",
  resources: "/api/admin/resources?page=1&limit=50",
  privacy: "/api/admin/privacy-policy",
  terms: "/api/admin/terms-of-use",
  settings: "/api/admin/settings",
  homeCms: "/api/admin/home-cms",
  aboutCms: "/api/admin/about-page-cms",
  advocateCms: "/api/admin/non-legal-advocate-cms",
  contactCms: "/api/admin/contact-page-cms",
  genericCms: null,
  notifications: "/api/admin/notifications?page=1&limit=50",
};

const ADVOCATE_ISSUE_TYPES = [
  {
    label: "Dispute Over Fines or Violations",
    value: "dispute over fines or violations",
  },
  {
    label: "Unfair Fees or Assessments",
    value: "unfair fees or assessments",
  },
  { label: "Harassment by HOA Board", value: "harassment by hoa board" },
  { label: "Property Damage Issues", value: "property damage issues" },
  { label: "Rights and Access Denied", value: "rights and access denied" },
  { label: "Other", value: "other" },
];

const STORY_ISSUE_TYPES = [
  { label: "Fines or Violations", value: "fines or violations" },
  { label: "Board Harassment", value: "board harassment" },
  {
    label: "Neglect or Unsafe Conditions",
    value: "neglect or unsafe conditions",
  },
  {
    label: "Unfair Fees or Assessments",
    value: "unfair fees or assessments",
  },
  { label: "Property Damage", value: "property damage" },
  { label: "Selective Enforcement", value: "selective enforcement" },
];

const ATTORNEY_PRACTICE_AREAS = [
  "HOA & Condo Disputes",
  "Property Damage / Neglect",
  "Selective Enforcement",
  "Mediation & Pre-Suit Help",
  "Assessment & Fee Disputes",
  "Board Governance Issues",
  "Foreclosure Defense",
  "Fair Housing / Discrimination",
  "Construction Defects",
  "General HOA Litigation",
];

const frontendQueueNotes = {
  contact:
    "Showing browser-local contact submissions that are not in the backend yet.",
  advocate:
    "Backend non-legal advocate listing API is not mounted yet. Showing same-browser frontend submissions until backend queue routes are added.",
  moderation:
    "Moderation backend API is pending. Use this frontend queue to track manual moderation items for now.",
  notifications:
    "Notification routes are not mounted in the backend yet. This panel is ready and will populate when /api/admin/notifications is added.",
};

const queueConfig = {
  stories: {
    label: "Story Queue",
    sidebarLabel: "Stories",
    icon: <FaRegNewspaper />,
    accent: "bg-[#4a8bc1]",
    statuses: [
      "new",
      "under_review",
      "flagged",
      "approved",
      "published",
      "unpublished",
      "archived",
      "removed",
    ],
    title: (record) => record.story_summary || record.story_hoa_name,
    person: (record) => record.story_name,
    email: (record) => record.story_email,
    body: (record) => record.story_body,
    meta: (record) =>
      [record.story_city, record.story_state].filter(Boolean).join(", "),
  },
  removalRequests: {
    label: "Story Removal Requests",
    sidebarLabel: "Removal Requests",
    icon: <FiTrash2 />,
    accent: "bg-[#c8102e]",
    statuses: ["new", "rejected", "completed"],
    title: (record) => record.caseId || "Story removal request",
    person: (record) => record.name,
    email: (record) => record.email,
    body: (record) => record.reason,
    meta: (record) => record.reason || "No removal reason provided",
  },
  contact: {
    label: "Contact Queue",
    sidebarLabel: "Contacts",
    icon: <MdOutlineContactMail />,
    accent: "bg-[#e4bc73]",
    statuses: ["new", "under_review", "needs_followup", "closed"],
    title: (record) => record.contact_subject,
    person: (record) => record.contact_name,
    email: (record) => record.contact_email,
    body: (record) => record.contact_message,
    meta: (record) => record.contact_phone,
  },
  advocate: {
    label: "Advocate Requests",
    sidebarLabel: "Advocate Requests",
    icon: <FiMessageSquare />,
    accent: "bg-[#2e4353]",
    statuses: [
      "new",
      "under_review",
      "needs_follow_up",
      "flagged",
      "closed",
      "archieved",
    ],
    title: (record) => record.adv_name,
    person: (record) => record.adv_name,
    email: (record) => record.adv_email,
    body: (record) => record.adv_issue_summary,
    meta: (record) =>
      [record.adv_hoa_name, record.adv_state].filter(Boolean).join(", "),
  },
  // moderation: {
  //   label: "Moderation Queue",
  //   sidebarLabel: "Moderation",
  //   icon: <FiAlertTriangle />,
  //   accent: "bg-[#b95f24]",
  //   statuses: ["new", "closed"],
  //   title: (record) => record.moderation_title || record.title,
  //   person: (record) => record.reported_by || record.source_queue || "Admin",
  //   email: (record) => record.source_label || "",
  //   body: (record) => record.moderation_summary || record.internal_notes || "",
  //   meta: (record) => record.reason || record.status,
  // },
  attorneys: {
    label: "Attorney Submissions",
    sidebarLabel: "Attorneys",
    icon: <MdOutlineGavel />,
    accent: "bg-[#e64863]",
    statuses: [
      "new",
      "under_review",
      "approved",
      "declined",
      "published",
      "unpublished",
      "archived",
    ],
    title: (record) => record.attorney_firm,
    person: (record) => record.attorney_name,
    email: (record) => record.attorney_email,
    body: (record) => record.attorney_summary,
    meta: (record) =>
      [record.attorney_city, record.attorney_state].filter(Boolean).join(", "),
  },
  faqs: {
    label: "FAQ Manager",
    sidebarLabel: "FAQs",
    icon: <FiHelpCircle />,
    accent: "bg-[#0a6b3b]",
    statuses: ["draft", "published"],
    title: (record) => record.question,
    person: (record) => record.category,
    email: () => "",
    body: (record) => record.answer,
    meta: (record) => `Sort order ${record.sortOrder ?? 0}`,
  },
  blogs: {
    label: "Blog Manager",
    sidebarLabel: "Blog",
    icon: <FiFileText />,
    accent: "bg-[#c8102e]",
    statuses: ["draft", "review", "published", "archived"],
    title: (record) => record.title,
    person: (record) => record.category,
    email: (record) =>
      Array.isArray(record.tags) ? record.tags.join(", ") : record.slug,
    body: (record) => record.excerpt || record.body,
    meta: (record) => record.slug || "No slug",
  },
  pages: {
    label: "CMS Pages",
    sidebarLabel: "Pages",
    icon: <FiEdit3 />,
    accent: "bg-[#7b6bb8]",
    statuses: ["draft", "published", "review"],
    title: (record) => record.title || record.hero_title,
    person: () => "CMS Page",
    email: (record) => record.slug || "",
    body: (record) => record.hero_body,
    meta: (record) => record.publish_status || record.status || "Draft",
  },
  settings: {
    label: "Site Settings",
    sidebarLabel: "Settings",
    icon: <FiSettings />,
    accent: "bg-[#2f6f6f]",
    statuses: ["published"],
    title: () => "Site Settings",
    person: () => "Global Website",
    email: () => "/api/admin/settings",
    body: (record) =>
      record.defaultSEO?.metaDescription ||
      record.footer?.text ||
      "Website configuration",
    meta: (record) =>
      record.contactInfo?.email || "Logo, navigation, footer, SEO",
  },
  homeCms: {
    label: "Home CMS",
    sidebarLabel: "Home CMS",
    icon: <FiGrid />,
    accent: "bg-[#4a8bc1]",
    statuses: ["published"],
    title: () => "Home Page CMS",
    person: () => "CMS Page",
    email: () => "/api/admin/home-cms",
    body: (record) =>
      record.hero?.introText || record.hero?.subtitle || "Home content",
    meta: (record) => record.pageKey || "home",
  },
  aboutCms: {
    label: "About CMS",
    sidebarLabel: "About CMS",
    icon: <FiFileText />,
    accent: "bg-[#0a6b3b]",
    statuses: ["published"],
    title: () => "About Page CMS",
    person: () => "CMS Page",
    email: () => "/api/admin/about-page-cms",
    body: (record) => stripHtml(record.content || "").slice(0, 180),
    meta: (record) => record.pageKey || "about",
  },
  advocateCms: {
    label: "Non-Legal Advocate CMS",
    sidebarLabel: "Advocate CMS",
    icon: <FiMessageSquare />,
    accent: "bg-[#b95f24]",
    statuses: ["published"],
    title: () => "Non-Legal Advocate CMS",
    person: () => "CMS Page",
    email: () => "/api/admin/non-legal-advocate-cms",
    body: (record) =>
      record.description || record.subtitle || "Advocate page content",
    meta: (record) => record.pageKey || "non-legal-advocate",
  },
  contactCms: {
    label: "Contact Page CMS",
    sidebarLabel: "Contact CMS",
    icon: <MdOutlineContactMail />,
    accent: "bg-[#e4bc73]",
    statuses: ["published"],
    title: () => "Contact Page CMS",
    person: () => "CMS Page",
    email: () => "/api/admin/contact-page-cms",
    body: (record) =>
      record.description || record.heading || "Contact page content",
    meta: (record) => record.pageKey || "contact",
  },
  genericCms: {
    label: "Generic CMS by ID",
    sidebarLabel: "Generic CMS",
    icon: <FiSettings />,
    accent: "bg-[#5d6b7d]",
    statuses: ["editor"],
    title: (record) =>
      record.pageKey ? `Generic CMS: ${record.pageKey}` : "Generic CMS by ID",
    person: () => "CMS Page",
    email: (record) => record.id || record.cmsLookupId || "/api/admin/cms/:id",
    body: (record) =>
      record.sections?.[0]?.titleMain || "Load and edit a CMS record by id",
    meta: (record) => record.pageKey || "ID required",
  },
  notifications: {
    label: "Notifications",
    sidebarLabel: "Notifications",
    icon: <FiBell />,
    accent: "bg-[#c8102e]",
    statuses: ["unread", "read"],
    title: (record) => record.title || "Admin notification",
    person: (record) => record.relatedModule || "System",
    email: () => "",
    body: (record) => record.description || "",
    meta: (record) => record.type || record.status || "Notification",
  },
  resources: {
    label: "Resources",
    sidebarLabel: "Resources",
    icon: <FiBookOpen />,
    accent: "bg-[#92753b]",
    statuses: ["draft", "review", "published", "unpublish", "archived"],
    title: (record) => record.title,
    person: (record) => record.category || "Resource",
    email: (record) => record.slug || "",
    body: (record) => record.summary || stripHtml(record.body),
    meta: (record) => record.slug || record.category || "No slug",
  },
  privacy: {
    label: "Privacy Policy",
    sidebarLabel: "Privacy",
    icon: <FiFileText />,
    accent: "bg-[#0a6b3b]",
    statuses: ["published"],
    title: () => "Privacy Policy",
    person: () => "Legal Page",
    email: () => "/privacy-policy",
    body: (record) => stripHtml(record.body).slice(0, 180),
    meta: () => "Public legal content",
  },
  terms: {
    label: "Terms of Use",
    sidebarLabel: "Terms",
    icon: <FiFileText />,
    accent: "bg-[#405b6d]",
    statuses: ["published"],
    title: () => "Terms of Use",
    person: () => "Legal Page",
    email: () => "/terms-of-use",
    body: (record) => stripHtml(record.body).slice(0, 180),
    meta: () => "Public legal content",
  },
};

const queueKeys = Object.keys(queueConfig);
const cmsSidebarQueues = ["homeCms", "aboutCms", "advocateCms", "contactCms"];
const sidebarQueuesWithoutBadges = ["settings", "privacy", "terms"];
const sidebarQueueKeys = [
  "stories",
  "removalRequests",
  "contact",
  "advocate",
  "attorneys",
];
const sidebarManagementKeys = ["faqs", "blogs", "pages"];
const sidebarSystemKeys = ["notifications", "resources", "settings"];
const sidebarLegalKeys = ["privacy", "terms"];
const paginatedQueueKeys = [
  "stories",
  "removalRequests",
  "contact",
  "advocate",
  "moderation",
  "attorneys",
  "faqs",
  "blogs",
  "pages",
  "notifications",
];
const pageSizeOptions = [10, 25, 50];
const queuesWithLastUpdated = new Set([
  "stories",
  "removalRequests",
  "contact",
  "advocate",
  "attorneys",
  "faqs",
  "blogs",
  "pages",
  "resources",
]);
const directEditQueueKeys = [
  "settings",
  "homeCms",
  "aboutCms",
  "advocateCms",
  "contactCms",
  "genericCms",
  "privacy",
  "terms",
];
const dashboardQueueKeys = ["stories", "contact", "advocate", "attorneys"];
const dashboardManagerKeys = ["faqs", "blogs", "pages"];
const dashboardActivityKeys = ["notifications", "resources"];
const dashboardQuickActionKeys = [
  "settings",
  "homeCms",
  "aboutCms",
  "advocateCms",
  "contactCms",
  "privacy",
  "terms",
];
const ADMIN_DASHBOARD_PATH = "/admin/dashboard";

function getAdminSectionPath(queue) {
  return `${ADMIN_DASHBOARD_PATH}/${queue}`;
}

function getQueueFromAdminPath(pathname) {
  const section = String(pathname || "")
    .split("/")
    .filter(Boolean)
    .at(-1);
  return queueConfig[section] ? section : "";
}
const dashboardCountKeys = {
  stories: ["stories"],
  contact: ["contacts"],
  advocate: ["nonLegalAdvocates"],
  attorneys: ["attorneys"],
  faqs: ["fAQs", "faqs"],
  blogs: ["blogPosts", "blogs"],
  pages: ["pages"],
  resources: ["resources"],
  notifications: ["notifications"],
};

function getRecordKey(record) {
  return (
    record?.id ||
    record?._id ||
    record?.singletonKey ||
    record?.caseId ||
    record?.slug ||
    record?.title ||
    ""
  );
}

function formatStatus(value) {
  if (!value) return "New";
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function createSlug(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getResponseRows(response) {
  const candidates = [
    response?.data,
    response?.records,
    response?.pages,
    response?.results,
    response?.data?.records,
    response?.data?.pages,
    response?.data?.results,
    response?.data?.docs,
  ];
  return candidates.find(Array.isArray) || [];
}

function getNotificationRows(response) {
  const candidates = [
    response?.data,
    response?.records,
    response?.notifications,
    response?.data?.records,
    response?.data?.notifications,
  ];
  return candidates.find(Array.isArray) || [];
}

async function fetchFirstAvailableEndpoint(endpoints) {
  const candidates = Array.isArray(endpoints) ? endpoints : [endpoints];
  let lastError = null;

  for (const endpoint of candidates.filter(Boolean)) {
    try {
      return await getJson(endpoint);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("No backend endpoint configured.");
}

function buildPagesListingEndpoint({
  page = 1,
  limit = 10,
  sortOrder = "desc",
  status = "All",
  search = "",
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortOrder,
  });

  if (status && status !== "All") {
    params.set("status", status);
  }
  if (search.trim()) {
    params.set("search", search.trim());
  }

  return `/api/admin/pages?${params.toString()}`;
}

function buildRemovalRequestsEndpoint({
  page = 1,
  limit = 10,
  search = "",
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search.trim()) params.set("search", search.trim());
  return `/api/admin/story/removal-requests?${params.toString()}`;
}

function getPagesPagination(response, fallback = {}) {
  const rows = getResponseRows(response);
  const source =
    response?.pagination ||
    response?.data?.pagination ||
    response?.meta?.pagination ||
    response?.meta ||
    response?.data ||
    response ||
    {};
  const page = Number(
    source.page ??
      source.currentPage ??
      response?.page ??
      response?.currentPage ??
      fallback.page ??
      1,
  );
  const limit = Number(
    (source.limit ??
      source.pageSize ??
      response?.limit ??
      response?.pageSize ??
      fallback.limit ??
      rows.length) ||
      10,
  );
  const total = Number(
    source.total ??
      source.totalResults ??
      source.totalItems ??
      source.totalRecords ??
      source.totalDocs ??
      response?.total ??
      response?.totalItems ??
      response?.totalRecords ??
      response?.totalDocs ??
      rows.length,
  );
  const totalPages = Number(
    source.totalPages ??
      source.pages ??
      response?.totalPages ??
      response?.pages ??
      Math.max(1, Math.ceil(total / Math.max(1, limit))),
  );

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 10,
    total: Number.isFinite(total) && total >= 0 ? total : rows.length,
    totalPages:
      Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1,
  };
}

function normalizeRecord(record) {
  const status = record.status || record.publish_status || "new";
  return {
    ...record,
    id: record.id || record._id,
    created_at: record.created_at || record.createdAt,
    status: status === "archieved" ? "archived" : status,
  };
}

function mergeLocalQueueRows(queue, remoteRows) {
  const localRows = getLocalQueueRecords(queue).map(normalizeRecord);
  const remoteKeys = new Set(remoteRows.map(getRecordKey).filter(Boolean));
  const localOnlyRows = localRows.filter(
    (record) => !remoteKeys.has(getRecordKey(record)),
  );
  return [...remoteRows, ...localOnlyRows];
}

function normalizeSingleRecord(response, fallback) {
  const record = response?.data || response?.record || response || fallback;
  return normalizeRecord(record);
}

function normalizePageRecord(response, fallback = {}) {
  const responseRecord =
    response?.data?.page ||
    response?.page ||
    response?.data?.record ||
    response?.record ||
    response?.data ||
    (response?.id || response?._id ? response : {});

  return normalizeRecord({
    ...fallback,
    ...(responseRecord &&
    typeof responseRecord === "object" &&
    !Array.isArray(responseRecord)
      ? responseRecord
      : {}),
  });
}

function normalizeLegalRecord(response, queue) {
  const title = queue === "privacy" ? "Privacy Policy" : "Terms of Use";
  const slug = queue === "privacy" ? "privacy-policy" : "terms-of-use";
  const source =
    response && Object.prototype.hasOwnProperty.call(response, "data")
      ? response.data
      : normalizeApiRecord(response, null);
  const record = source || { body: "" };

  return normalizeRecord({
    ...record,
    title,
    slug,
    singletonKey: queue,
    status: "published",
    backendMissing: !source,
  });
}

function normalizeQueueRows(queue, response) {
  if (queue === "settings") {
    return [normalizeSettingsRecord(response)];
  }
  if (cmsQueueKeys.includes(queue)) {
    return [normalizeCmsRecord(response, queue)];
  }
  if (queue === "notifications") {
    return getResponseRows(response).map(normalizeNotificationRecord);
  }
  if (queue === "privacy" || queue === "terms") {
    return [normalizeLegalRecord(response, queue)];
  }

  const remoteRows = getResponseRows(response).map(normalizeRecord);
  return isFrontendManagedQueue(queue)
    ? mergeLocalQueueRows(queue, remoteRows)
    : remoteRows;
}

async function fetchQueueRows(queue) {
  if (queue === "genericCms") {
    return [normalizeCmsRecord({ pageKey: "", cmsLookupId: "" }, queue)];
  }

  const response = await fetchFirstAvailableEndpoint(queueEndpoints[queue]);
  return normalizeQueueRows(queue, response);
}

async function fetchPagesPage(options) {
  const response = await getJson(buildPagesListingEndpoint(options));
  return {
    records: normalizeQueueRows("pages", response),
    pagination: getPagesPagination(response, options),
  };
}

async function fetchRemovalRequestsPage(options) {
  const response = await getJson(buildRemovalRequestsEndpoint(options));
  return {
    records: normalizeQueueRows("removalRequests", response),
    pagination: getPagesPagination(response, options),
  };
}

function getCountValue(counts, keys) {
  const source = counts?.data || counts || {};
  for (const key of keys) {
    const value = source[key];
    const numericValue =
      typeof value === "object" && value !== null
        ? Number(value.total ?? value.count ?? value.value)
        : Number(value);
    if (Number.isFinite(numericValue)) return numericValue;
  }
  return null;
}

function normalizeDashboardCounts(response) {
  return Object.entries(dashboardCountKeys).reduce((result, [queue, keys]) => {
    const total = getCountValue(response, keys);
    if (total !== null) {
      result[queue] = {
        total,
        newCount: queue === "notifications" ? total : 0,
        isPending: false,
      };
    }
    return result;
  }, {});
}

function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getNotificationTargetQueue(relatedModule) {
  const moduleKey = String(relatedModule || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

  const moduleQueueMap = {
    story: "stories",
    stories: "stories",
    "story-removal-request": "removalRequests",
    "story-removal-requests": "removalRequests",
    "removal-request": "removalRequests",
    "removal-requests": "removalRequests",
    contact: "contact",
    advocate: "advocate",
    "advocate-request": "advocate",
    "non-legal-advocate": "advocate",
    attorney: "attorneys",
    attorneys: "attorneys",
    faq: "faqs",
    faqs: "faqs",
    blog: "blogs",
    blogs: "blogs",
    resource: "resources",
    resources: "resources",
  };

  return moduleQueueMap[moduleKey] || "";
}

function getNotificationCaseId(notification) {
  const candidates = [
    notification?.caseId,
    notification?.relatedCaseId,
    notification?.relatedId,
    notification?.description,
    notification?.title,
    notification?.actionUrl,
  ];

  for (const candidate of candidates) {
    const match = String(candidate || "").match(/STORY-[A-Z0-9]{15}/i);
    if (match) return match[0].toUpperCase();
  }

  return "";
}

function recordText(queue, record) {
  const config = queueConfig[queue];
  return [
    config.title(record),
    config.person(record),
    config.email(record),
    config.body(record),
    config.meta(record),
    record.status,
    record.publish_status,
    record.question,
    record.answer,
    record.category,
    record.title,
    record.slug,
    record.excerpt,
    record.body,
    record.summary,
    record.description,
    record.hero_title,
    record.hero_body,
    record.publish_status,
    Array.isArray(record.tags) ? record.tags.join(" ") : record.tags,
    record.seo_title,
    record.meta_description,
    record.assigned_reviewer,
    record.internal_notes,
    record.caseId,
    record.reason,
    record.rejectionReason,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getTagsInput(record) {
  if (typeof record?.tagsInput === "string") return record.tagsInput;
  if (Array.isArray(record?.tags)) return record.tags.join(", ");
  if (typeof record?.tags === "string") return record.tags;
  return "";
}

function normalizeBlogStatus(status) {
  return status === "archieved" ? "archived" : status || "draft";
}

function getPracticeAreasInput(record) {
  return getAttorneyPracticeAreas(record).join(", ");
}

function parseCommaList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseIssueTypeValues(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string") return [];

  try {
    const parsedValue = JSON.parse(value);
    return Array.isArray(parsedValue)
      ? parsedValue.map(String)
      : parseCommaList(value);
  } catch {
    return parseCommaList(value);
  }
}

function getAttorneyPracticeAreas(record) {
  const value =
    record?.practiceAreasInput !== undefined
      ? record.practiceAreasInput
      : record?.attorney_practice_areas;
  const canonicalAreas = new Map(
    ATTORNEY_PRACTICE_AREAS.map((area) => [area.toLowerCase(), area]),
  );

  return parseIssueTypeValues(value)
    .map((area) => canonicalAreas.get(area.trim().toLowerCase()))
    .filter(Boolean);
}

function normalizeIssueTypeValues(value, options) {
  const allowedValues = new Set(options.map((option) => option.value));
  return parseIssueTypeValues(value)
    .map((issueType) => issueType.trim().toLowerCase())
    .filter((issueType) => allowedValues.has(issueType));
}

function getStoryIssueTypes(record) {
  const value =
    record?.storyIssuesInput !== undefined
      ? record.storyIssuesInput
      : record?.story_issue_type;
  return normalizeIssueTypeValues(value, STORY_ISSUE_TYPES);
}

function getStoryIssuesInput(record) {
  return getStoryIssueTypes(record).join(", ");
}

function getAdvocateIssueTypes(record) {
  return normalizeIssueTypeValues(
    record?.adv_issue_types,
    ADVOCATE_ISSUE_TYPES,
  );
}

function buildStoryPayload(record) {
  const issueTypes = getStoryIssueTypes(record);
  const requiredFields = {
    "Story name": record.story_name,
    State: record.story_state,
    "Story summary": record.story_summary,
    "Story body": record.story_body,
  };

  Object.entries(requiredFields).forEach(([label, value]) => {
    if (!String(value || "").trim()) {
      throw new Error(`${label} is required.`);
    }
  });

  if (issueTypes.length === 0) {
    throw new Error("At least one story issue type is required.");
  }

  if (String(record.story_summary || "").trim().length > 300) {
    throw new Error("Story summary must be 300 characters or less.");
  }

  const payload = {
    story_name: String(record.story_name || "").trim(),
    story_city: String(record.story_city || "").trim(),
    story_state: String(record.story_state || "").trim(),
    story_hoa_name: String(record.story_hoa_name || "").trim(),
    story_issue_type: issueTypes,
    story_summary: String(record.story_summary || "").trim(),
    story_body: String(record.story_body || "").trim(),
    story_anonymous: Boolean(record.story_anonymous),
    adminNotes: record.adminNotes || "",
  };

  return payload;
}

const storyStatusRoutes = {
  flagged: "flag",
  approved: "approve",
  published: "publish",
  unpublished: "unpublish",
  archived: "archive",
};

const MAX_STORY_UPLOADS = 50;

async function updateStoryWorkflowStatus(record, status) {
  const route = storyStatusRoutes[status];
  if (!record?.id || !route) return record;

  const payload =
    status === "flagged" ? { flagReason: record.flagReason || "" } : undefined;
  const response = await patchJson(
    `/api/admin/story/update-status/${route}/${record.id}`,
    payload,
  );
  return normalizeSingleRecord(response, record);
}

function getStoryUploadUrl(upload) {
  return typeof upload === "string" ? upload : upload?.fileUrl || "";
}

function getStoryUploadLabel(upload) {
  return typeof upload === "string"
    ? upload
    : upload?.fileName || upload?.fileUrl || "Attached file";
}

function getAdvocateUploads(record) {
  const uploads = record?.adv_uploads;
  if (Array.isArray(uploads)) return uploads;
  if (!uploads) return [];

  if (typeof uploads === "string") {
    try {
      const parsedUploads = JSON.parse(uploads);
      return Array.isArray(parsedUploads) ? parsedUploads : [uploads];
    } catch {
      return [uploads];
    }
  }

  return [uploads];
}

function getAdvocateUploadUrl(upload) {
  return typeof upload === "string"
    ? upload
    : upload?.fileUrl ||
        upload?.url ||
        upload?.file_url ||
        upload?.path ||
        "";
}

function getAdvocateUploadLabel(upload) {
  if (typeof upload !== "string") {
    return (
      upload?.fileName ||
      upload?.filename ||
      upload?.originalname ||
      getAdvocateUploadUrl(upload) ||
      "Attached file"
    );
  }

  const pathWithoutQuery = upload.split(/[?#]/)[0];
  return pathWithoutQuery.split("/").filter(Boolean).pop() || upload;
}

function buildAttorneyPayload(record) {
  const practiceAreas = getAttorneyPracticeAreas(record);
  if (practiceAreas.length === 0) {
    throw new Error("At least one practice area is required.");
  }

  return {
    attorney_name: record.attorney_name || "",
    attorney_firm: record.attorney_firm || "",
    attorney_email: record.attorney_email || "",
    attorney_phone: record.attorney_phone || "",
    attorney_website: record.attorney_website || "",
    attorney_city: record.attorney_city || "",
    attorney_state: record.attorney_state || "",
    attorney_county: record.attorney_county || "",
    attorney_practice_areas: practiceAreas,
    attorney_summary: record.attorney_summary || "",
    attorney_bio: record.attorney_bio || "",
  };
}

function buildContactStatusPayload(record) {
  const status = record.status || "new";
  if (!queueConfig.contact.statuses.includes(status)) {
    throw new Error(
      `Contact status must be one of: ${queueConfig.contact.statuses.join(", ")}.`,
    );
  }

  return { status };
}

function buildAdvocatePayload(record) {
  const status = record.status || "new";
  if (!queueConfig.advocate.statuses.includes(status)) {
    throw new Error(
      `Advocate status must be one of: ${queueConfig.advocate.statuses.join(", ")}.`,
    );
  }

  return {
    adv_name: String(record.adv_name || "").trim(),
    adv_email: String(record.adv_email || "").trim(),
    adv_phone: String(record.adv_phone || "").trim(),
    adv_state: String(record.adv_state || "").trim(),
    adv_hoa_name: String(record.adv_hoa_name || "").trim(),
    adv_issue_summary: String(record.adv_issue_summary || "").trim(),
    adv_issue_types: getAdvocateIssueTypes(record),
    ...(record.adv_best_time_to_call
      ? {
          adv_best_time_to_call: String(
            record.adv_best_time_to_call,
          ).trim(),
        }
      : {}),
    adv_estimated_damages: String(record.adv_estimated_damages || "").trim(),
    adv_key_dates: String(record.adv_key_dates || "").trim(),
    status,
  };
}

function buildModerationPayload(record) {
  return {
    moderation_title: String(
      record.moderation_title || record.title || "",
    ).trim(),
    moderation_summary: String(
      record.moderation_summary ||
        record.description ||
        record.internal_notes ||
        "",
    ).trim(),
    reason: record.reason || "warning",
    source_queue: record.source_queue || "moderation",
    source_label: record.source_label || "",
    internal_notes: record.internal_notes || "",
    status: record.status || "new",
  };
}
function appendRequiredFormField(formData, field, value, label = field) {
  if (!String(value || "").trim()) {
    throw new Error(`${formatStatus(label)} is required.`);
  }
  formData.append(field, String(value).trim());
}

function buildBlogFormData(record, requireImage) {
  const formData = new FormData();
  const requiredFields = {
    title: record.title,
    excerpt: record.excerpt,
    body: record.body,
    category: record.category,
  };

  Object.entries(requiredFields).forEach(([field, value]) => {
    if (!String(value || "").trim()) {
      throw new Error(`${formatStatus(field)} is required.`);
    }
    formData.append(field, String(value).trim());
  });

  if (record.id) {
    if (!String(record.slug || "").trim()) {
      throw new Error("Slug is required.");
    }
    formData.append("slug", String(record.slug).trim());
  }

  const tags = getTagsInput(record)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  formData.append("tags", JSON.stringify(tags));
  formData.append("status", normalizeBlogStatus(record.status));
  formData.append("seo_title", record.seo_title || "");
  formData.append("meta_description", record.meta_description || "");

  if (record.featuredImageFile) {
    formData.append("featured_image", record.featuredImageFile);
  } else if (requireImage) {
    throw new Error(
      "Please select a banner / featured image before creating the blog post.",
    );
  }

  return formData;
}

function buildPagePayload(record) {
  const publishStatus =
    record.status || record.publish_status || "draft";
  if (!queueConfig.pages.statuses.includes(publishStatus)) {
    throw new Error(
      `Page status must be one of: ${queueConfig.pages.statuses.join(", ")}.`,
    );
  }

  const payload = {
    title: String(record.title || "").trim(),
    hero_title: String(record.hero_title || "").trim(),
    hero_body: String(record.hero_body || "").trim(),
    seo_title: String(record.seo_title || "").trim(),
    meta_description: String(record.meta_description || "").trim(),
    publish_status: publishStatus,
  };
  const slug = String(record.slug || "").trim();
  if (slug) {
    payload.slug = slug;
  }

  Object.entries(payload).forEach(([field, value]) => {
    if (!["publish_status", "slug"].includes(field) && !value) {
      throw new Error(`${formatStatus(field)} is required.`);
    }
  });

  return payload;
}

function buildResourceFormData(record, requireImage) {
  const formData = new FormData();

  appendRequiredFormField(formData, "title", record.title, "title");
  appendRequiredFormField(formData, "summary", record.summary, "summary");
  appendRequiredFormField(formData, "body", record.body, "body");
  appendRequiredFormField(formData, "category", record.category, "category");

  if (record.id) {
    appendRequiredFormField(formData, "slug", record.slug, "slug");
    formData.append("seo_title", record.seo_title || record.title || "");
    formData.append(
      "meta_description",
      record.meta_description ||
        record.summary ||
        stripHtml(record.body).slice(0, 160),
    );
  } else {
    formData.append("seo_title", record.seo_title || "");
    formData.append("meta_description", record.meta_description || "");
  }

  formData.append("status", record.status || "draft");

  if (record.featuredImageFile) {
    formData.append("featured_image", record.featuredImageFile);
  } else if (requireImage) {
    throw new Error(
      "Please select a featured image before creating the resource.",
    );
  }

  if (record.resourceFile) {
    formData.append("file", record.resourceFile);
  }

  return formData;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialQueue = getQueueFromAdminPath(location.pathname);
  const [activeQueue, setActiveQueue] = useState(initialQueue || "stories");
  const [isDashboardView, setDashboardView] = useState(!initialQueue);
  const [isCmsMenuOpen, setCmsMenuOpen] = useState(true);
  const [recordsByQueue, setRecordsByQueue] = useState({});
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagesSortOrder, setPagesSortOrder] = useState("desc");
  const [pagesPagination, setPagesPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setLoading] = useState(true);
  const [isRecordDetailsLoading, setRecordDetailsLoading] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dashboardCounts, setDashboardCounts] = useState({});
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isNotificationDropdownOpen, setNotificationDropdownOpen] =
    useState(false);
  const [notificationPreview, setNotificationPreview] = useState([]);
  const [isNotificationPreviewLoading, setNotificationPreviewLoading] =
    useState(false);
  const [notificationPreviewError, setNotificationPreviewError] = useState("");
  const [readingNotificationId, setReadingNotificationId] = useState("");
  const notificationDropdownRef = useRef(null);
  const queueLoadRequestIdRef = useRef(0);
  const recordDetailsRequestIdRef = useRef(0);

  const loadDashboardCounts = useCallback(async () => {
    setError("");

    try {
      const response = await getJson("/api/admin/records-count");
      setDashboardCounts(normalizeDashboardCounts(response));
    } catch (requestError) {
      setError(requestError.message);
    }
  }, []);

  const loadNotificationPreview = useCallback(async () => {
    setNotificationPreviewLoading(true);
    setNotificationPreviewError("");

    try {
      const response = await getJson("/api/admin/notifications?page=1&limit=5");
      setNotificationPreview(
        getNotificationRows(response)
          .slice(0, 5)
          .map(normalizeNotificationRecord),
      );
    } catch (requestError) {
      setNotificationPreview([]);
      setNotificationPreviewError(requestError.message);
    } finally {
      setNotificationPreviewLoading(false);
    }
  }, []);

  const loadQueue = useCallback(
    async (queue, { selectFirst = false, ...listingOptions } = {}) => {
      const requestId = ++queueLoadRequestIdRef.current;
      setLoading(true);
      setError("");

      try {
        const pageResult =
          queue === "pages"
            ? await fetchPagesPage(listingOptions)
            : queue === "removalRequests"
              ? await fetchRemovalRequestsPage(listingOptions)
              : null;
        const records = pageResult
          ? pageResult.records
          : await fetchQueueRows(queue);
      if (requestId !== queueLoadRequestIdRef.current) return;

      if (pageResult) {
        setPagesPagination(pageResult.pagination);
      }

      setRecordsByQueue((current) => ({
        ...current,
        [queue]: records,
      }));

      if (selectFirst) {
        setSelectedRecord(records[0] ? { ...records[0], queue } : null);
      } else {
        setSelectedRecord((current) =>
          current?.queue === queue
            ? records.find(
                (record) => getRecordKey(record) === getRecordKey(current),
              ) || null
            : null,
        );
      }
      } catch (requestError) {
        if (requestId !== queueLoadRequestIdRef.current) return;

        if (queue === "notifications") {
          setRecordsByQueue((current) => ({ ...current, notifications: [] }));
        } else if (isFrontendManagedQueue(queue)) {
          const records = getLocalQueueRecords(queue).map(normalizeRecord);
          setRecordsByQueue((current) => ({ ...current, [queue]: records }));
          if (selectFirst) {
            setSelectedRecord(records[0] ? { ...records[0], queue } : null);
          }
        } else {
          setError(requestError.message);
        }
      } finally {
        if (requestId === queueLoadRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const handleAdminAuthExpired = () => {
      setMobileSidebarOpen(false);
      navigate("/admin/login", { replace: true });
    };

    window.addEventListener("hoa-admin-auth-expired", handleAdminAuthExpired);

    return () => {
      window.removeEventListener(
        "hoa-admin-auth-expired",
        handleAdminAuthExpired,
      );
    };
  }, [navigate]);

  useEffect(() => {
    if (!isNotificationDropdownOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!notificationDropdownRef.current?.contains(event.target)) {
        setNotificationDropdownOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setNotificationDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isNotificationDropdownOpen]);

  useEffect(() => {
    if (!initialQueue) return undefined;

    let isCurrent = true;
    // Sidebar badge counts are independent from the opened page's records.
    queueMicrotask(() => {
      if (isCurrent) loadDashboardCounts();
    });

    return () => {
      isCurrent = false;
    };
  }, [initialQueue, loadDashboardCounts]);
  useEffect(() => {
    let isCurrent = true;
    const routeQueue = getQueueFromAdminPath(location.pathname);

    queueMicrotask(() => {
      if (!isCurrent) return;

      if (routeQueue) {
        recordDetailsRequestIdRef.current += 1;
        setRecordDetailsLoading(false);
        setDashboardView(false);
        setActiveQueue(routeQueue);
        setQuery("");
        setStatusFilter("All");
        setCurrentPage(1);
        setPagesSortOrder("desc");
        setSelectedRecord(null);
        setMessage("");
        setError("");
        if (!["pages", "removalRequests"].includes(routeQueue)) {
          loadQueue(routeQueue, {
            selectFirst: directEditQueueKeys.includes(routeQueue),
          });
        }
        return;
      }

      queueLoadRequestIdRef.current += 1;
      recordDetailsRequestIdRef.current += 1;
      setRecordDetailsLoading(false);
      setDashboardView(true);
      setQuery("");
      setStatusFilter("All");
      setCurrentPage(1);
      setSelectedRecord(null);
      loadDashboardCounts();
    });

    return () => {
      isCurrent = false;
    };
  }, [loadDashboardCounts, loadQueue, location.pathname]);

  useEffect(() => {
    if (
      isDashboardView ||
      !["pages", "removalRequests"].includes(activeQueue)
    ) {
      return undefined;
    }

    const timeoutId = window.setTimeout(
      () => {
        loadQueue(activeQueue, {
          page: currentPage,
          limit: pageSize,
          sortOrder: pagesSortOrder,
          status: statusFilter,
          search:
            activeQueue === "removalRequests" && !query.trim()
              ? statusFilter === "All"
                ? ""
                : statusFilter
              : query,
        });
      },
      query.trim() ? 300 : 0,
    );

    return () => window.clearTimeout(timeoutId);
  }, [
    activeQueue,
    currentPage,
    isDashboardView,
    loadQueue,
    pageSize,
    pagesSortOrder,
    query,
    statusFilter,
  ]);

  const handleLogout = async () => {
    setMobileSidebarOpen(false);
    await logoutAdminRemote();
    navigate("/admin/login", { replace: true });
  };

  const openDashboard = () => {
    setMobileSidebarOpen(false);
    navigate(ADMIN_DASHBOARD_PATH);
  };

  const switchToQueue = (queue) => {
    setMobileSidebarOpen(false);
    navigate(getAdminSectionPath(queue));
  };

  const startNewFaq = () => {
    navigate(getAdminSectionPath("faqs"));
    setDashboardView(false);
    setActiveQueue("faqs");
    setStatusFilter("All");
    setMessage("");
    setError("");

    const existingFaqs = recordsByQueue.faqs || [];
    const maxSortOrder = existingFaqs.reduce((max, faq) => {
      const order = Number(faq.sortOrder ?? 0);
      return order > max ? order : max;
    }, -1);
    const nextSortOrder = Math.max(maxSortOrder + 1, 1);

    setSelectedRecord({
      queue: "faqs",
      question: "",
      answer: "",
      category: "general",
      sortOrder: nextSortOrder,
      status: "draft",
    });
  };

  const startNewBlog = () => {
    navigate(getAdminSectionPath("blogs"));
    setDashboardView(false);
    setActiveQueue("blogs");
    setStatusFilter("All");
    setMessage("");
    setError("");
    setSelectedRecord({
      queue: "blogs",
      draftKey: `new-blog-${Date.now()}`,
      title: "",
      excerpt: "",
      body: "",
      category: "",
      tagsInput: "",
      status: "draft",
      seo_title: "",
      meta_description: "",
      featured_image: "",
      featuredImageFile: null,
    });
  };

  const startNewPage = () => {
    navigate(getAdminSectionPath("pages"));
    setDashboardView(false);
    setActiveQueue("pages");
    setStatusFilter("All");
    setMessage("");
    setError("");
    setSelectedRecord({
      queue: "pages",
      draftKey: `new-page-${Date.now()}`,
      title: "",
      slug: "",
      slugAutoGenerated: true,
      hero_title: "",
      hero_body: "",
      publish_status: "draft",
      status: "draft",
      seo_title: "",
      meta_description: "",
    });
  };

  const startNewResource = () => {
    navigate(getAdminSectionPath("resources"));
    setDashboardView(false);
    setActiveQueue("resources");
    setStatusFilter("All");
    setMessage("");
    setError("");
    setSelectedRecord({
      queue: "resources",
      draftKey: `new-resource-${Date.now()}`,
      title: "",
      slug: "",
      summary: "",
      body: "",
      category: "",
      status: "draft",
      seo_title: "",
      meta_description: "",
      featured_image: "",
      featuredImageFile: null,
      resourceFile: null,
    });
  };

  const startNewModeration = () => {
    navigate(getAdminSectionPath("moderation"));
    setDashboardView(false);
    setActiveQueue("moderation");
    setStatusFilter("All");
    setMessage("");
    setError("");
    setSelectedRecord({
      queue: "moderation",
      draftKey: `new-moderation-${Date.now()}`,
      moderation_title: "",
      moderation_summary: "",
      reason: "",
      source_queue: "",
      source_label: "",
      reported_by: "Admin",
      internal_notes: "",
      status: "new",
    });
  };

  const activeRecords = useMemo(
    () => recordsByQueue[activeQueue] || [],
    [activeQueue, recordsByQueue],
  );
  const filteredRecords = useMemo(() => {
    if (activeQueue === "pages") {
      return activeRecords;
    }

    return activeRecords.filter((record) => {
      const matchesStatus =
        statusFilter === "All" || record.status === statusFilter;
      const matchesQuery =
        query.trim().length === 0 ||
        recordText(activeQueue, record).includes(query.trim().toLowerCase());

      return matchesStatus && matchesQuery;
    });
  }, [activeQueue, activeRecords, query, statusFilter]);

  const isActiveQueuePaginated = paginatedQueueKeys.includes(activeQueue);
  const isPagesQueue = activeQueue === "pages";
  const isServerPaginatedQueue = ["pages", "removalRequests"].includes(
    activeQueue,
  );
  const isDirectEditQueue = directEditQueueKeys.includes(activeQueue);
  const totalPages = isServerPaginatedQueue
    ? pagesPagination.totalPages
    : isActiveQueuePaginated
      ? Math.max(1, Math.ceil(filteredRecords.length / pageSize))
      : 1;
  const safeCurrentPage = isServerPaginatedQueue
    ? pagesPagination.page
    : Math.min(currentPage, totalPages);
  const paginationStart = isActiveQueuePaginated
    ? (safeCurrentPage - 1) * pageSize
    : 0;
  const visibleRecords = isServerPaginatedQueue
    ? filteredRecords
    : isActiveQueuePaginated
      ? filteredRecords.slice(paginationStart, paginationStart + pageSize)
      : filteredRecords;
  const visibleStart =
    visibleRecords.length === 0 ? 0 : paginationStart + 1;
  const visibleEnd = isServerPaginatedQueue
    ? Math.min(
        paginationStart + visibleRecords.length,
        pagesPagination.total,
      )
    : Math.min(
        paginationStart + visibleRecords.length,
        filteredRecords.length,
      );

  const totals = useMemo(() => {
    return queueKeys.reduce((result, queue) => {
      const records = recordsByQueue[queue] || [];
      const counted = dashboardCounts[queue];
      result[queue] = counted || {
        total: records.length,
        newCount: records.filter((record) => record.status === "new").length,
        isPending: records.some((record) => record.localOnly),
      };
      return result;
    }, {});
  }, [dashboardCounts, recordsByQueue]);

  const openRecord = async (queue, record) => {
    const detailsRequestId = ++recordDetailsRequestIdRef.current;
    setMessage("");
    setError("");

    if (queue === "notifications") {
      let notificationRecord = record;
      if (!record.isRead && record.id) {
        const updatedNotification = await markNotificationRead(
          record.id,
          { ...record, queue },
          { silent: true },
        );
        if (updatedNotification) {
          notificationRecord = updatedNotification;
        }
      }

      if (detailsRequestId !== recordDetailsRequestIdRef.current) return;

      const targetQueue = getNotificationTargetQueue(
        notificationRecord.relatedModule,
      );
      const targetId = notificationRecord.relatedId;

      if (targetQueue === "removalRequests") {
        const caseId = getNotificationCaseId(notificationRecord);
        setNotificationDropdownOpen(false);

        if (!caseId) {
          toast.error(
            "The removal-request notification does not contain a valid Case ID.",
          );
          setSelectedRecord({ ...notificationRecord, queue });
          return;
        }

        setRecordDetailsLoading(true);
        setSelectedRecord(null);

        try {
          const result = await fetchRemovalRequestsPage({
            page: 1,
            limit: 10,
            search: caseId,
          });
          if (detailsRequestId !== recordDetailsRequestIdRef.current) return;

          const removalRequest = result.records.find(
            (request) =>
              String(request.caseId || "").toUpperCase() === caseId,
          );

          if (!removalRequest) {
            throw new Error(`No removal request was found for ${caseId}.`);
          }

          setRecordsByQueue((current) => {
            const currentRequests = current.removalRequests || [];
            const hasRequest = currentRequests.some(
              (request) =>
                String(request.caseId || "").toUpperCase() === caseId,
            );

            return {
              ...current,
              removalRequests: hasRequest
                ? currentRequests.map((request) =>
                    String(request.caseId || "").toUpperCase() === caseId
                      ? removalRequest
                      : request,
                  )
                : [removalRequest, ...currentRequests],
            };
          });

          setRecordDetailsLoading(false);
          await openRecord("removalRequests", removalRequest);
        } catch (requestError) {
          if (detailsRequestId !== recordDetailsRequestIdRef.current) return;
          setRecordDetailsLoading(false);
          toast.error(
            requestError.message ||
              `Unable to load the removal request for ${caseId}.`,
          );
        }
        return;
      }

      if (targetQueue && targetId) {
        queueLoadRequestIdRef.current += 1;
        setNotificationDropdownOpen(false);
        setSelectedRecord(null);
        await openRecord(targetQueue, { id: targetId });
      } else {
        setSelectedRecord({ ...notificationRecord, queue });
      }
      return;
    }

    setSelectedRecord({ ...record, queue });

    const detailsEndpoint =
      queue === "stories"
        ? `/api/admin/story/details/${record.id}`
        : queue === "removalRequests"
          ? `/api/admin/story/${encodeURIComponent(record.caseId)}`
        : queue === "attorneys"
          ? `/api/admin/attorney/${record.id}`
          : queue === "contact"
            ? `/api/admin/contact/${record.id}`
            : queue === "advocate"
              ? `/api/admin/non-legal-advocate/${record.id}`
              : queue === "moderation"
                ? `/api/admin/moderation/${record.id}`
                : queue === "faqs"
                  ? `/api/admin/faq/${record.id}`
                  : queue === "blogs"
                    ? `/api/admin/blog/${record.id}`
                    : queue === "resources"
                      ? `/api/admin/resource/${record.id}`
                      : queue === "pages"
                        ? `/api/admin/page/${record.id}`
                        : queue === "settings"
                          ? "/api/admin/settings"
                          : queue === "homeCms"
                            ? "/api/admin/home-cms"
                            : queue === "aboutCms"
                              ? "/api/admin/about-page-cms"
                              : queue === "advocateCms"
                                ? "/api/admin/non-legal-advocate-cms"
                                : queue === "contactCms"
                                  ? "/api/admin/contact-page-cms"
                                  : queue === "genericCms" && record.id
                                    ? `/api/admin/cms/${record.id}`
                                    : queue === "notifications"
                                      ? null
                                      : queue === "privacy"
                                        ? "/api/admin/privacy-policy"
                                        : queue === "terms"
                                          ? "/api/admin/terms-of-use"
                                          : null;

    if (isFrontendManagedQueue(queue) && record.localOnly) {
      setSelectedRecord({ ...record, queue });
      return;
    }

    if (!detailsEndpoint) return;

    setRecordDetailsLoading(true);
    try {
      const response = await getJson(detailsEndpoint);
      if (detailsRequestId !== recordDetailsRequestIdRef.current) return;

      const detailedRecord =
        queue === "settings"
          ? normalizeSettingsRecord(response)
          : cmsQueueKeys.includes(queue)
            ? normalizeCmsRecord(response, queue)
            : queue === "privacy" || queue === "terms"
              ? normalizeLegalRecord(response, queue)
            : queue === "pages"
                ? normalizePageRecord(response, record)
              : queue === "removalRequests"
                ? normalizeRecord({
                    ...record,
                    linkedStory: normalizeApiRecord(response, null),
                  })
              : normalizeSingleRecord(response, record);
      const selectedDetails =
        queue === "blogs"
          ? { ...detailedRecord, tagsInput: getTagsInput(detailedRecord) }
          : queue === "attorneys"
            ? {
                ...detailedRecord,
                practiceAreasInput: getPracticeAreasInput(detailedRecord),
              }
            : queue === "stories"
              ? {
                  ...detailedRecord,
                  storyIssuesInput: getStoryIssuesInput(detailedRecord),
                }
              : detailedRecord;

      setRecordsByQueue((current) => ({
        ...current,
        [queue]: (current[queue] || []).map((item) =>
          getRecordKey(item) === getRecordKey(detailedRecord)
            ? detailedRecord
            : item,
        ),
      }));
      setSelectedRecord({ ...selectedDetails, queue });
    } catch (requestError) {
      if (detailsRequestId !== recordDetailsRequestIdRef.current) return;

      setError(requestError.message);
      setSelectedRecord(null);
    } finally {
      if (detailsRequestId === recordDetailsRequestIdRef.current) {
        setRecordDetailsLoading(false);
      }
    }
  };

  const updateSelectedField = (field, value) => {
    setSelectedRecord((record) => {
      if (!record) return record;
      return { ...record, [field]: value };
    });
  };

  const updateSelectedRecord = (updater) => {
    setSelectedRecord((current) => {
      if (!current) return current;
      return typeof updater === "function"
        ? updater(current)
        : { ...current, ...updater };
    });
  };

  const reviewRemovalRequestStory = async () => {
    const caseId = String(selectedRecord?.caseId || "").trim().toUpperCase();
    if (!caseId || selectedRecord?.queue !== "removalRequests") return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await getJson(
        `/api/admin/story/${encodeURIComponent(caseId)}`,
      );
      const detailedRecord = normalizeSingleRecord(response, null);
      if (!detailedRecord?.id) {
        throw new Error(
          `The story for ${caseId} was loaded without its update identifier.`,
        );
      }
      const storyForReview = {
        ...detailedRecord,
        storyIssuesInput: getStoryIssuesInput(detailedRecord),
      };
      setSelectedRecord({ ...storyForReview, queue: "stories" });
    } catch (requestError) {
      toast.error(
        requestError.message || `Unable to load the story for ${caseId}.`,
      );
    } finally {
      setSaving(false);
    }
  };

  const applyRemovalRequestUpdate = (response, fallbackStatus) => {
    const responseRecord = normalizeApiRecord(response, null);
    const updated = normalizeRecord({
      ...selectedRecord,
      ...(responseRecord && typeof responseRecord === "object"
        ? responseRecord
        : {}),
      status: responseRecord?.status || fallbackStatus,
      linkedStory: selectedRecord?.linkedStory,
    });

    setRecordsByQueue((current) => ({
      ...current,
      removalRequests: (current.removalRequests || []).map((record) =>
        record.caseId === updated.caseId ? updated : record,
      ),
    }));
    setSelectedRecord({ ...updated, queue: "removalRequests" });
  };

  const completeStoryRemoval = async () => {
    const caseId = selectedRecord?.caseId;
    if (!caseId || selectedRecord?.queue !== "removalRequests") return;
    if (
      !window.confirm(
        `Remove the published story ${caseId}? This action changes its status to removed.`,
      )
    ) {
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await patchJson(
        `/api/admin/story/remove/${encodeURIComponent(caseId)}`,
      );
      applyRemovalRequestUpdate(response, "completed");
      toast.success(`Story ${caseId} was removed successfully.`);
    } catch (requestError) {
      toast.error(
        requestError.message || `Unable to remove story ${caseId}.`,
      );
    } finally {
      setSaving(false);
    }
  };

  const rejectStoryRemoval = async () => {
    const caseId = selectedRecord?.caseId;
    const rejectionReason = String(
      selectedRecord?.rejectionReason || "",
    ).trim();
    if (!caseId || selectedRecord?.queue !== "removalRequests") return;
    if (!rejectionReason) {
      toast.error("Enter a rejection reason before rejecting this request.");
      return;
    }
    if (!window.confirm(`Reject the removal request for ${caseId}?`)) return;

    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await patchJson(
        `/api/admin/story/reject-removal/${encodeURIComponent(caseId)}`,
        { rejectionReason },
      );
      applyRemovalRequestUpdate(response, "rejected");
      toast.success(`Removal request for ${caseId} was rejected.`);
    } catch (requestError) {
      toast.error(
        requestError.message ||
          `Unable to reject the removal request for ${caseId}.`,
      );
    } finally {
      setSaving(false);
    }
  };

  const loadGenericCmsById = async (cmsId) => {
    const id = String(cmsId || "").trim();
    if (!id) {
      setError("CMS record id is required.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await getJson(`/api/admin/cms/${id}`);
      const updatedRecord = normalizeCmsRecord(response, "genericCms");
      setRecordsByQueue((current) => ({
        ...current,
        genericCms: [updatedRecord],
      }));
      setSelectedRecord({ ...updatedRecord, queue: "genericCms" });
      setMessage("CMS record loaded.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const saveSelectedRecord = async () => {
    if (!selectedRecord) return;
    const isCreatingRecord = !selectedRecord.id;
    const shouldCloseAfterSave = !directEditQueueKeys.includes(
      selectedRecord.queue,
    );
    setSaving(true);
    setMessage("");
    setError("");

    try {
      let updatedRecord = selectedRecord;
      const originalRecord =
        (recordsByQueue[selectedRecord.queue] || []).find(
          (record) => getRecordKey(record) === getRecordKey(selectedRecord),
        ) || {};

      if (selectedRecord.queue === "stories") {
        const requestedStatus = selectedRecord.status;
        const detailsResponse = await putJson(
          `/api/admin/story/update/${selectedRecord.id}`,
          buildStoryPayload(selectedRecord),
        );
        updatedRecord = normalizeSingleRecord(detailsResponse, selectedRecord);

        const originalStatus = originalRecord.status || updatedRecord.status;
        const originalFlagReason = originalRecord.flagReason || "";
        const shouldUpdateStatus =
          storyStatusRoutes[requestedStatus] &&
          (requestedStatus !== originalStatus ||
            (requestedStatus === "flagged" &&
              (selectedRecord.flagReason || "") !== originalFlagReason));

        if (requestedStatus === "published" && !updatedRecord.isApproved) {
          const approveResponse = await patchJson(
            `/api/admin/story/update-status/approve/${selectedRecord.id}`,
          );
          updatedRecord = normalizeSingleRecord(approveResponse, updatedRecord);
        }

        if (shouldUpdateStatus) {
          updatedRecord = await updateStoryWorkflowStatus(
            { ...updatedRecord, ...selectedRecord, id: selectedRecord.id },
            requestedStatus,
          );
        }

        updatedRecord = {
          ...updatedRecord,
          storyIssuesInput: getStoryIssuesInput(updatedRecord),
        };
      } else if (selectedRecord.queue === "attorneys") {
        const statusRoutes = {
          approved: "approve",
          declined: "decline",
          published: "publish",
          unpublished: "unpublish",
          archived: "archieve",
        };
        const detailsResponse = await putJson(
          `/api/admin/attorney/update-details/${selectedRecord.id}`,
          buildAttorneyPayload(selectedRecord),
        );
        updatedRecord = normalizeSingleRecord(detailsResponse, selectedRecord);

        const requestedStatus = selectedRecord.status;
        const currentStatus = updatedRecord.status;
        const statusRoute = statusRoutes[requestedStatus];

        if (
          requestedStatus === "published" &&
          !updatedRecord.isApproved &&
          currentStatus !== "approved"
        ) {
          const approveResponse = await patchJson(
            `/api/admin/attorney/update-status/approve/${selectedRecord.id}`,
          );
          updatedRecord = normalizeSingleRecord(approveResponse, updatedRecord);
        }

        if (statusRoute && requestedStatus !== updatedRecord.status) {
          const payload =
            requestedStatus === "declined"
              ? {
                  declineReason:
                    selectedRecord.declineReason ||
                    selectedRecord.internal_notes ||
                    "profile information is incomplete",
                }
              : undefined;
          const statusResponse = await patchJson(
            `/api/admin/attorney/update-status/${statusRoute}/${selectedRecord.id}`,
            payload,
          );
          updatedRecord = normalizeSingleRecord(statusResponse, updatedRecord);
        }

        updatedRecord = {
          ...updatedRecord,
          practiceAreasInput: getPracticeAreasInput(updatedRecord),
        };
      } else if (
        selectedRecord.queue === "contact" &&
        !selectedRecord.localOnly
      ) {
        if (!selectedRecord.id) {
          throw new Error("Contact record id is required to update status.");
        }
        const response = await patchJson(
          `/api/admin/contact/update-status/${selectedRecord.id}`,
          buildContactStatusPayload(selectedRecord),
        );
        updatedRecord = normalizeSingleRecord(response, selectedRecord);
      } else if (
        selectedRecord.queue === "advocate" &&
        !selectedRecord.localOnly
      ) {
        const response = await putJson(
          `/api/admin/non-legal-advocate/update-details/${selectedRecord.id}`,
          buildAdvocatePayload(selectedRecord),
        );
        updatedRecord = normalizeSingleRecord(response, selectedRecord);
      } else if (
        selectedRecord.queue === "moderation" &&
        !selectedRecord.localOnly
      ) {
        const moderationPayload = buildModerationPayload(selectedRecord);
        const response = selectedRecord.id
          ? await putJson(
              `/api/admin/moderation/update-details/${selectedRecord.id}`,
              moderationPayload,
            )
          : await postJson("/api/admin/moderation/create", moderationPayload);
        updatedRecord = normalizeSingleRecord(response, selectedRecord);
      } else if (selectedRecord.queue === "settings") {
        if (!selectedRecord.id) {
          throw new Error("Site settings record was not found in the backend.");
        }
        const response = await putFormData(
          `/api/admin/settings/${selectedRecord.id}`,
          buildSettingsFormData(selectedRecord),
        );
        updatedRecord = normalizeSettingsRecord(response);
      } else if (selectedRecord.queue === "homeCms") {
        if (!selectedRecord.id) {
          throw new Error("Home CMS record was not found in the backend.");
        }
        const response = await putFormData(
          `/api/admin/home-cms/${selectedRecord.id}`,
          buildHomeCmsFormData(selectedRecord),
        );
        updatedRecord = normalizeCmsRecord(response, "homeCms");
      } else if (selectedRecord.queue === "aboutCms") {
        if (!selectedRecord.id) {
          throw new Error("About CMS record was not found in the backend.");
        }
        const response = await putJson(
          `/api/admin/about-cms/${selectedRecord.id}`,
          buildAboutCmsPayload(selectedRecord),
        );
        updatedRecord = normalizeCmsRecord(response, "aboutCms");
      } else if (selectedRecord.queue === "advocateCms") {
        if (!selectedRecord.id) {
          throw new Error(
            "Non-legal advocate CMS record was not found in the backend.",
          );
        }
        const response = await putFormData(
          `/api/admin/non-legal-advocate-cms/${selectedRecord.id}`,
          buildAdvocateCmsFormData(selectedRecord),
        );
        updatedRecord = normalizeCmsRecord(response, "advocateCms");
      } else if (selectedRecord.queue === "contactCms") {
        if (!selectedRecord.id) {
          throw new Error(
            "Contact page CMS record was not found in the backend.",
          );
        }
        const response = await putJson(
          `/api/admin/contact-page-cms/${selectedRecord.id}`,
          buildContactCmsPayload(selectedRecord),
        );
        updatedRecord = normalizeCmsRecord(response, "contactCms");
      } else if (selectedRecord.queue === "genericCms") {
        const cmsId = selectedRecord.id || selectedRecord.cmsLookupId;
        if (!cmsId) {
          throw new Error("Load a generic CMS record by id before saving.");
        }
        const response = await putFormData(
          `/api/admin/cms/${cmsId}`,
          buildGenericCmsFormData(selectedRecord),
        );
        updatedRecord = normalizeCmsRecord(response, "genericCms");
      } else if (selectedRecord.queue === "faqs") {
        const faqPayload = {
          question: selectedRecord.question || "",
          answer: selectedRecord.answer || "",
          category: selectedRecord.category || "general",
          sortOrder: Number(selectedRecord.sortOrder || 0),
          publish_status:
            selectedRecord.status || selectedRecord.publish_status || "draft",
        };
        const response = selectedRecord.id
          ? await putJson(
              `/api/admin/faq/update-details/${selectedRecord.id}`,
              faqPayload,
            )
          : await postJson("/api/admin/faq/create", faqPayload);
        updatedRecord = normalizeSingleRecord(response, {
          ...selectedRecord,
          ...faqPayload,
          status: faqPayload.publish_status,
        });
        if (!updatedRecord.id && response?.data?._id) {
          updatedRecord.id = response.data._id;
        }
        if (
          selectedRecord.id &&
          faqPayload.publish_status !==
            (originalRecord.status || originalRecord.publish_status)
        ) {
          const statusResponse = await patchJson(
            `/api/admin/faq/update-status/${selectedRecord.id}`,
            { publish_status: faqPayload.publish_status },
          );
          updatedRecord = normalizeSingleRecord(statusResponse, updatedRecord);
        }
      } else if (selectedRecord.queue === "blogs") {
        const formData = buildBlogFormData(selectedRecord, !selectedRecord.id);
        const response = selectedRecord.id
          ? await putFormData(
              `/api/admin/blog/update-details/${selectedRecord.id}`,
              formData,
            )
          : await postFormData("/api/admin/blog/create", formData);

        updatedRecord = normalizeSingleRecord(response, selectedRecord);
        const requestedBlogStatus = normalizeBlogStatus(selectedRecord.status);
        if (
          selectedRecord.id &&
          requestedBlogStatus !== normalizeBlogStatus(originalRecord.status)
        ) {
          const statusResponse = await patchJson(
            `/api/admin/blog/update-status/${selectedRecord.id}`,
            { status: requestedBlogStatus },
          );
          updatedRecord = normalizeSingleRecord(statusResponse, updatedRecord);
        }
        updatedRecord = {
          ...updatedRecord,
          status: normalizeBlogStatus(updatedRecord.status),
          tagsInput: getTagsInput(updatedRecord),
        };
      } else if (selectedRecord.queue === "pages") {
        const pagePayload = buildPagePayload(selectedRecord);
        const response = selectedRecord.id
          ? await putJson(
              `/api/admin/page/update-details/${selectedRecord.id}`,
              pagePayload,
            )
          : await postJson("/api/admin/page/create", pagePayload);

        updatedRecord = normalizePageRecord(response, {
          ...selectedRecord,
          ...pagePayload,
        });
        const requestedPageStatus = pagePayload.publish_status;
        if (
          selectedRecord.id &&
          requestedPageStatus !==
            (originalRecord.status || originalRecord.publish_status)
        ) {
          const statusResponse = await patchJson(
            `/api/admin/page/update-status/${selectedRecord.id}`,
            { publish_status: requestedPageStatus },
          );
          updatedRecord = normalizePageRecord(statusResponse, {
            ...updatedRecord,
            publish_status: requestedPageStatus,
            status: requestedPageStatus,
          });
        }
        updatedRecord = {
          ...updatedRecord,
          status: updatedRecord.publish_status || updatedRecord.status,
        };
      } else if (selectedRecord.queue === "resources") {
        const formData = buildResourceFormData(
          selectedRecord,
          !selectedRecord.id,
        );
        const response = selectedRecord.id
          ? await putFormData(
              `/api/admin/resource/update-details/${selectedRecord.id}`,
              formData,
            )
          : await postFormData("/api/admin/resource/create", formData);

        updatedRecord = normalizeSingleRecord(response, selectedRecord);
      } else if (isFrontendManagedQueue(selectedRecord.queue)) {
        updatedRecord = normalizeRecord(
          upsertLocalQueueRecord(selectedRecord.queue, selectedRecord),
        );
      } else if (
        selectedRecord.queue === "privacy" ||
        selectedRecord.queue === "terms"
      ) {
        if (!selectedRecord.id) {
          throw new Error(
            `${selectedConfig.label} record was not found in the backend seed data.`,
          );
        }

        if (!String(selectedRecord.body || "").trim()) {
          throw new Error(`${selectedConfig.label} content is required.`);
        }

        const response = await putJson(
          selectedRecord.queue === "privacy"
            ? `/api/admin/privacy-policy/${selectedRecord.id}`
            : `/api/admin/terms-of-use/${selectedRecord.id}`,
          { body: selectedRecord.body },
        );

        updatedRecord = normalizeLegalRecord(response, selectedRecord.queue);
      } else {
        throw new Error("This queue is not editable in the current frontend.");
      }

      setRecordsByQueue((current) => ({
        ...current,
        [selectedRecord.queue]: selectedRecord.id
          ? (current[selectedRecord.queue] || []).map((record) =>
              getRecordKey(record) === getRecordKey(updatedRecord)
                ? updatedRecord
                : record,
            )
          : [updatedRecord, ...(current[selectedRecord.queue] || [])],
      }));
      if (selectedRecord.queue === "pages") {
        const nextPage = isCreatingRecord ? 1 : currentPage;
        if (isCreatingRecord) {
          setCurrentPage(1);
        }
        await loadQueue("pages", {
          page: nextPage,
          limit: pageSize,
          sortOrder: pagesSortOrder,
          status: statusFilter,
          search: query,
        });
      }
      if (shouldCloseAfterSave) {
        setSelectedRecord(null);
      } else {
        setSelectedRecord({ ...updatedRecord, queue: selectedRecord.queue });
      }
      setMessage("");
      toast.success(
        `${selectedConfig?.label || "Record"} ${
          isCreatingRecord ? "created" : "updated"
        } successfully.`,
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteSelectedContent = async () => {
    if (!selectedRecord?.id) return;

    if (selectedRecord.queue === "resources") {
      const confirmed = window.confirm("Archive this resource?");
      if (!confirmed) return;

      setSaving(true);
      setMessage("");
      setError("");

      try {
        const response = await patchJson(
          `/api/admin/resource/update-status/${selectedRecord.id}`,
          { status: "archived" },
        );
        const updatedRecord = normalizeSingleRecord(response, {
          ...selectedRecord,
          status: "archived",
        });
        setRecordsByQueue((current) => ({
          ...current,
          resources: (current.resources || []).map((record) =>
            getRecordKey(record) === getRecordKey(selectedRecord)
              ? { ...record, ...updatedRecord, status: "archived" }
              : record,
          ),
        }));
        setSelectedRecord({
          ...selectedRecord,
          ...updatedRecord,
          queue: "resources",
          status: "archived",
        });
        setMessage("Resource archived.");
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setSaving(false);
      }
      return;
    }

    if (
      isFrontendManagedQueue(selectedRecord.queue) &&
      selectedRecord.localOnly
    ) {
      const confirmed = window.confirm("Remove this frontend queue item?");
      if (!confirmed) return;

      removeLocalQueueRecord(selectedRecord.queue, selectedRecord);
      setRecordsByQueue((current) => ({
        ...current,
        [selectedRecord.queue]: (current[selectedRecord.queue] || []).filter(
          (record) => getRecordKey(record) !== getRecordKey(selectedRecord),
        ),
      }));
      setSelectedRecord(null);
      setMessage("Frontend queue item removed.");
      return;
    }

    if (!["blogs", "pages"].includes(selectedRecord.queue)) return;
    const label = selectedRecord.queue === "blogs" ? "blog post" : "CMS page";
    const confirmed = window.confirm(
      `Delete this ${label} permanently? This cannot be undone.`,
    );
    if (!confirmed) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      await deleteJson(
        selectedRecord.queue === "blogs"
          ? `/api/admin/blog/${selectedRecord.id}`
          : `/api/admin/page/${selectedRecord.id}`,
      );
      setRecordsByQueue((current) => ({
        ...current,
        [selectedRecord.queue]: (current[selectedRecord.queue] || []).filter(
          (record) => getRecordKey(record) !== getRecordKey(selectedRecord),
        ),
      }));
      if (selectedRecord.queue === "pages") {
        const remainingTotal = Math.max(0, pagesPagination.total - 1);
        const remainingTotalPages = Math.max(
          1,
          Math.ceil(remainingTotal / pageSize),
        );
        const nextPage = Math.min(currentPage, remainingTotalPages);
        setCurrentPage(nextPage);
        await loadQueue("pages", {
          page: nextPage,
          limit: pageSize,
          sortOrder: pagesSortOrder,
          status: statusFilter,
          search: query,
        });
      }
      setSelectedRecord(null);
      setMessage(`${formatStatus(label)} deleted.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const [isUploadingFiles, setUploadingFiles] = useState(false);
  const uploadFileInputRef = useRef(null);
  const [storyUploadToRemove, setStoryUploadToRemove] = useState(null);
  const existingStoryUploadCount = Array.isArray(selectedRecord?.story_uploads)
    ? selectedRecord.story_uploads.length
    : 0;
  const remainingStoryUploadSlots = Math.max(
    0,
    MAX_STORY_UPLOADS - existingStoryUploadCount,
  );

  const removeStoryUpload = async () => {
    const fileUrl = storyUploadToRemove?.fileUrl;
    const storyId = selectedRecord?.id;
    if (!storyId || !fileUrl) return;

    setUploadingFiles(true);
    setMessage("");
    setError("");
    try {
      await deleteJson(
        `/api/admin/story/remove-uploads/${storyId}`,
        { fileUrls: [fileUrl] },
      );

      const withoutRemovedUpload = (record) => ({
        ...record,
        story_uploads: (record.story_uploads || []).filter(
          (upload) => getStoryUploadUrl(upload) !== fileUrl,
        ),
      });

      setSelectedRecord((current) =>
        current?.id === storyId ? withoutRemovedUpload(current) : current,
      );
      setRecordsByQueue((current) => ({
        ...current,
        stories: (current.stories || []).map((record) =>
          record.id === storyId ? withoutRemovedUpload(record) : record,
        ),
      }));
      setStoryUploadToRemove(null);
      setMessage("File removed successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingFiles(false);
    }
  };

  const addStoryUploads = async (files) => {
    if (!selectedRecord?.id || !files?.length) return;
    const nextFiles = Array.from(files);

    if (remainingStoryUploadSlots === 0) {
      setError(`This story already has the maximum of ${MAX_STORY_UPLOADS} files.`);
      if (uploadFileInputRef.current) uploadFileInputRef.current.value = "";
      return;
    }

    if (nextFiles.length > remainingStoryUploadSlots) {
      setError(
        `You can add ${remainingStoryUploadSlots} more file${
          remainingStoryUploadSlots === 1 ? "" : "s"
        }. This story already has ${existingStoryUploadCount} of ${MAX_STORY_UPLOADS} files.`,
      );
      if (uploadFileInputRef.current) uploadFileInputRef.current.value = "";
      return;
    }

    setUploadingFiles(true);
    setMessage("");
    setError("");
    try {
      const fd = new FormData();
      nextFiles.forEach((file) => fd.append("uploads", file));
      const response = await patchFormData(
        `/api/admin/story/add-uploads/${selectedRecord.id}`,
        fd,
      );
      const updated = normalizeSingleRecord(response, selectedRecord);
      setSelectedRecord({
        ...updated,
        queue: "stories",
        storyIssuesInput: getStoryIssuesInput(updated),
      });
      setMessage("Files uploaded successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingFiles(false);
      if (uploadFileInputRef.current) uploadFileInputRef.current.value = "";
    }
  };

  const markNotificationRead = async (
    notificationId,
    fallbackRecord = selectedRecord,
    { silent = false } = {},
  ) => {
    setSaving(true);
    if (!silent) setMessage("");
    setError("");
    try {
      const response = await patchJson(
        `/api/admin/notification/${notificationId}/read`,
      );
      const updated = normalizeNotificationRecord(
        response?.data || {
          ...fallbackRecord,
          isRead: true,
          type: "light",
          status: "read",
        },
      );
      setRecordsByQueue((current) => ({
        ...current,
        notifications: (current.notifications || []).map((record) =>
          record.id === notificationId ? updated : record,
        ),
      }));
      setDashboardCounts((current) => {
        const currentCount = Number(current.notifications?.total || 0);
        const nextCount = Math.max(0, currentCount - 1);
        return {
          ...current,
          notifications: {
            total: nextCount,
            newCount: nextCount,
            isPending: false,
          },
        };
      });
      if (!silent) {
        setSelectedRecord({ ...updated, queue: "notifications" });
      }
      if (!silent) setMessage("Notification marked as read.");
      return updated;
    } catch (err) {
      setError(err.message);
      if (!silent) {
        setSelectedRecord({ ...fallbackRecord, queue: "notifications" });
      }
      return null;
    } finally {
      setSaving(false);
    }
  };

  const toggleNotificationDropdown = () => {
    const willOpen = !isNotificationDropdownOpen;
    setNotificationDropdownOpen(willOpen);

    if (willOpen) {
      loadNotificationPreview();
    }
  };

  const handlePreviewNotificationClick = async (notification) => {
    if (!notification?.id || readingNotificationId) return;

    setReadingNotificationId(notification.id);
    setNotificationPreviewError("");

    try {
      const response = await patchJson(
        `/api/admin/notification/${notification.id}/read`,
      );
      const responseRecord =
        response?.data?.notification ||
        response?.notification ||
        response?.data;
      const hasNotificationRecord =
        responseRecord &&
        typeof responseRecord === "object" &&
        (responseRecord.id || responseRecord._id);
      const updated = normalizeNotificationRecord(
        hasNotificationRecord
          ? { ...notification, ...responseRecord, isRead: true }
          : {
              ...notification,
              isRead: true,
              type: notification.type || "light",
              status: "read",
            },
      );

      setNotificationPreview((current) =>
        current.map((item) => (item.id === notification.id ? updated : item)),
      );
      setRecordsByQueue((current) => ({
        ...current,
        notifications: (current.notifications || []).map((item) =>
          item.id === notification.id ? updated : item,
        ),
      }));

      if (!notification.isRead) {
        setDashboardCounts((current) => {
          const currentCount = Number(current.notifications?.total || 0);
          const nextCount = Math.max(0, currentCount - 1);
          return {
            ...current,
            notifications: {
              total: nextCount,
              newCount: nextCount,
              isPending: false,
            },
          };
        });
      }

      await openRecord("notifications", updated);
    } catch (requestError) {
      setNotificationPreviewError(requestError.message);
    } finally {
      setReadingNotificationId("");
    }
  };

  const viewAllNotifications = () => {
    setNotificationDropdownOpen(false);
    switchToQueue("notifications");
  };

  const deleteNotification = async (notificationId) => {
    if (!window.confirm("Delete this notification permanently?")) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await deleteJson(`/api/admin/notification/${notificationId}`);
      setRecordsByQueue((current) => ({
        ...current,
        notifications: (current.notifications || []).filter(
          (r) => r.id !== notificationId,
        ),
      }));
      setSelectedRecord(null);
      setMessage("Notification deleted.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const selectedConfig = selectedRecord
    ? queueConfig[selectedRecord.queue]
    : null;
  const isSelectedRecordDirectEdit = selectedRecord
    ? directEditQueueKeys.includes(selectedRecord.queue)
    : false;
  const isCmsActive =
    !isDashboardView && cmsSidebarQueues.includes(activeQueue);

  const renderSidebarItem = (queue) => {
    const item = queueConfig[queue];
    const count = totals[queue]?.total || 0;
    const isActive = !isDashboardView && activeQueue === queue;

    return (
      <button
        type="button"
        key={queue}
        onClick={() => switchToQueue(queue)}
        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
          isActive
            ? "bg-[#1d4264] text-white shadow-[inset_3px_0_0_#35aef2]"
            : "text-white/88 hover:bg-white/[0.06] hover:text-white"
        }`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg transition ${
            isActive
              ? "border-[#35aef2]/35 bg-[#35aef2]/15 text-[#55bfff]"
              : "border-white/[0.07] bg-white/[0.045] text-[#efbd52] group-hover:border-white/15"
          }`}
        >
          {item.icon}
        </span>
        <span className="min-w-0 flex-1 text-[17px] font-medium">
          {item.sidebarLabel}
        </span>
        {count > 0 && !sidebarQueuesWithoutBadges.includes(queue) && (
          <span className="rounded-full bg-[#ed4663] px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
            {count}
          </span>
        )}
        <FiChevronRight className="shrink-0 text-xl text-white/55 transition group-hover:translate-x-0.5 group-hover:text-white/85" />
      </button>
    );
  };

  const renderSidebarSection = (label, queues) => (
    <section className="mt-7">
      <div className="mb-3 flex items-center gap-4 px-3">
        <h2 className="shrink-0 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8097ab]">
          {label}
        </h2>
        <span className="h-px flex-1 bg-white/[0.09]" />
      </div>
      <div className="space-y-1">{queues.map(renderSidebarItem)}</div>
    </section>
  );

  return (
    <main className="min-h-screen bg-[#f3f5f7] text-[#2f4251]">
      <div className="flex min-h-screen">
        {isMobileSidebarOpen && (
          <button
            type="button"
            aria-label="Close admin sidebar"
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/45 lg:hidden"
          />
        )}
        <aside
          className={`${
            isMobileSidebarOpen ? "fixed inset-y-0 left-0 z-40 flex" : "hidden"
          } w-[345px] max-w-[88vw] shrink-0 flex-col overflow-y-auto border-r border-white/[0.06] bg-[linear-gradient(145deg,#0d2b45_0%,#102b43_48%,#0b2439_100%)] text-white shadow-2xl lg:static lg:z-auto lg:flex lg:max-w-none`}
        >
          <div className="px-7 pb-2 pt-7">
            <div className="flex items-center justify-between gap-4">
              <div className="rounded-lg bg-white px-3 py-2 shadow-md">
                <img
                  src={logo}
                  alt="HOA Nightmares"
                  className="h-9 w-28 object-contain"
                />
              </div>
              <button
                type="button"
                aria-label="Close admin sidebar"
                onClick={() => setMobileSidebarOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/[0.025] text-xl text-white/70 transition hover:bg-white/10 hover:text-white lg:hidden"
              >
                <FiX />
              </button>
            </div>
            <div className="pb-7 pt-8">
              <h1 className="text-[32px] font-semibold tracking-[-0.02em] text-white">
                Admin Portal
              </h1>
              <p className="mt-1 font-serif text-xl italic text-[#91a8ba]">
                for HOA Nightmares
              </p>
            </div>
          </div>

          <nav className="px-5 pb-8">
            <button
              type="button"
              onClick={openDashboard}
              className={`group flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left transition ${
                isDashboardView
                  ? "bg-[linear-gradient(90deg,#174b78,#173b5d)] text-white shadow-[inset_4px_0_0_#37b5ff]"
                  : "text-white/85 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg text-2xl text-[#46baff]">
                <FiGrid />
              </span>
              <span className="text-xl font-medium">Dashboard</span>
            </button>

            {renderSidebarSection("Queues", sidebarQueueKeys)}
            {renderSidebarSection("Management", sidebarManagementKeys)}
            {renderSidebarSection("System & Communication", sidebarSystemKeys)}
            {renderSidebarSection("Legal & Policies", sidebarLegalKeys)}

            <section className="mt-7">
              <div className="mb-3 flex items-center gap-4 px-3">
                <h2 className="shrink-0 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8097ab]">
                  CMS Management
                </h2>
                <span className="h-px flex-1 bg-white/[0.09]" />
              </div>
              <button
                type="button"
                onClick={() => setCmsMenuOpen((open) => !open)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                  isCmsActive
                    ? "bg-[#1d4264] text-white"
                    : "bg-white/[0.045] text-white/90 hover:bg-white/[0.08]"
                }`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-lg text-[#efbd52]">
                  <FiFileText />
                </span>
                <span className="flex-1 text-[17px] font-medium">CMS</span>
                <span className="text-lg text-white/65">
                  {isCmsMenuOpen ? <FiChevronDown /> : <FiChevronRight />}
                </span>
              </button>
              {isCmsMenuOpen && (
                <div className="relative ml-8 mt-2 space-y-0.5 border-l border-[#34546e] py-1 pl-6">
                  {cmsSidebarQueues.map((queue, index) => {
                    const item = queueConfig[queue];
                    const isActive = !isDashboardView && activeQueue === queue;

                    return (
                      <button
                        type="button"
                        key={queue}
                        onClick={() => switchToQueue(queue)}
                        className={`relative flex w-full items-center rounded-lg px-2 py-2 text-left text-[15px] font-medium transition ${
                          isActive
                            ? "text-white"
                            : "text-[#a9bdcc] hover:bg-white/[0.05] hover:text-white"
                        }`}
                      >
                        <span
                          className={`absolute -left-[29px] h-2.5 w-2.5 rounded-full border-2 border-[#102b43] ${
                            isActive || index === 0
                              ? "bg-[#38b6ff]"
                              : "bg-[#3e607a]"
                          }`}
                        />
                        <span>{item.sidebarLabel}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </nav>

          <div className="mt-auto px-7 pb-7">
            <div className="mb-6 h-px bg-white/[0.1]" />
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 px-2 text-lg font-medium text-white/85 transition hover:text-white"
            >
              <FiLogOut className="text-xl" />
              Logout
            </button>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex min-h-[76px] items-center justify-between gap-4 border-b border-[#dce3e7] bg-white/95 px-4 py-3 text-[#2e4353] shadow-[0_4px_18px_rgba(25,42,54,0.06)] backdrop-blur md:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Open admin sidebar"
                onClick={() => setMobileSidebarOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d7e0e5] bg-[#f7f9fa] text-lg text-[#405b6d] transition hover:border-[#aebcc5] hover:bg-[#edf2f4] lg:hidden"
              >
                <FiMenu />
              </button>
              <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f3fa] text-lg text-[#3187bd] sm:flex">
                {isDashboardView ? <FiGrid /> : queueConfig[activeQueue].icon}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8a98a1]">
                  <span className="hidden sm:inline">Admin</span>
                  <FiChevronRight className="hidden sm:inline" />
                  <span className="truncate text-[#b1843e]">
                    {isDashboardView
                      ? "Overview"
                      : queueConfig[activeQueue].sidebarLabel}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-base font-bold text-[#2e4353] sm:text-lg">
                  {isDashboardView
                    ? "Dashboard"
                    : queueConfig[activeQueue].label}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
              <div ref={notificationDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={toggleNotificationDropdown}
                  aria-haspopup="dialog"
                  aria-expanded={isNotificationDropdownOpen}
                  aria-label={`${totals.notifications?.total || 0} notifications`}
                  className={`relative inline-flex h-10 items-center gap-2 rounded-xl border px-3 font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a9dd1]/35 ${
                    isNotificationDropdownOpen
                      ? "border-[#4a9dd1] bg-[#eaf4fa] text-[#2f7fae]"
                      : "border-[#d7e0e5] bg-[#f8fafb] text-[#405b6d] hover:border-[#aebcc5] hover:bg-[#edf2f4]"
                  }`}
                >
                  <FiBell />
                  <span>{totals.notifications?.total || 0}</span>
                  {(totals.notifications?.total || 0) > 0 && (
                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#e64863]" />
                  )}
                </button>

                {isNotificationDropdownOpen && (
                  <div
                    role="dialog"
                    aria-label="Recent notifications"
                    className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-[#d7dadd] bg-white text-[#2f4251] shadow-[0_18px_50px_rgba(25,42,54,0.28)]"
                  >
                    <div className="flex items-center justify-between border-b border-[#e3e7ea] bg-[#f8fafb] px-4 py-3">
                      <div>
                        <p className="font-bold text-[#2e4353]">
                          Notifications
                        </p>
                        <p className="mt-0.5 text-xs text-[#71808a]">
                          Your five most recent updates
                        </p>
                      </div>
                      <span className="rounded-full bg-[#e9eef1] px-2.5 py-1 text-xs font-bold text-[#405b6d]">
                        {totals.notifications?.total || 0} unread
                      </span>
                    </div>

                    <div className="max-h-[25rem] overflow-y-auto">
                      {isNotificationPreviewLoading && (
                        <div
                          role="status"
                          className="flex min-h-40 flex-col items-center justify-center gap-3 px-5 py-8 text-[#60717c]"
                        >
                          <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#d9e1e5] border-t-[#405b6d]" />
                          <span className="text-sm font-semibold">
                            Loading notifications...
                          </span>
                        </div>
                      )}

                      {!isNotificationPreviewLoading &&
                        notificationPreviewError && (
                          <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-700">
                            <p className="text-sm font-semibold">
                              {notificationPreviewError}
                            </p>
                            <button
                              type="button"
                              onClick={loadNotificationPreview}
                              className="mt-3 inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-bold hover:bg-red-100"
                            >
                              <FiRefreshCw />
                              Try again
                            </button>
                          </div>
                        )}

                      {!isNotificationPreviewLoading &&
                        !notificationPreviewError &&
                        notificationPreview.length === 0 && (
                          <div className="flex min-h-40 flex-col items-center justify-center px-5 py-8 text-center">
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#edf2f4] text-xl text-[#60717c]">
                              <FiBell />
                            </span>
                            <p className="mt-3 font-semibold text-[#405b6d]">
                              You’re all caught up
                            </p>
                            <p className="mt-1 text-xs text-[#71808a]">
                              New activity will appear here.
                            </p>
                          </div>
                        )}

                      {!isNotificationPreviewLoading &&
                        notificationPreview.map((notification) => {
                          const isReading =
                            readingNotificationId === notification.id;

                          return (
                            <button
                              type="button"
                              key={notification.id}
                              onClick={() =>
                                handlePreviewNotificationClick(notification)
                              }
                              disabled={Boolean(readingNotificationId)}
                              className={`group flex w-full items-start gap-3 border-b border-[#edf0f2] px-4 py-3.5 text-left transition last:border-b-0 hover:bg-[#f6f9fa] disabled:cursor-wait ${
                                notification.isRead
                                  ? "bg-white"
                                  : "bg-[#f1f7fa]"
                              }`}
                            >
                              <span
                                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                                  notification.isRead
                                    ? "bg-[#c7d0d5]"
                                    : "bg-[#e64863] ring-4 ring-[#e64863]/10"
                                }`}
                              />
                              <span className="min-w-0 flex-1">
                                <span className="flex items-start justify-between gap-3">
                                  <span className="line-clamp-1 font-bold text-[#2e4353]">
                                    {notification.title}
                                  </span>
                                  <span className="shrink-0 text-[11px] font-medium text-[#87939a]">
                                    ReceivedAt:{" "}
                                    {formatDate(notification.created_at)}
                                  </span>
                                </span>
                                {notification.description && (
                                  <span className="mt-1 line-clamp-2 block text-xs leading-5 text-[#667680]">
                                    {notification.description}
                                  </span>
                                )}
                                <span className="mt-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#8b6b32]">
                                  {notification.relatedModule ||
                                    "System notification"}
                                  {!notification.isRead && (
                                    <span className="normal-case tracking-normal text-[#e64863]">
                                      New
                                    </span>
                                  )}
                                </span>
                              </span>
                              {isReading ? (
                                <FiRefreshCw className="mt-1 shrink-0 animate-spin text-[#60717c]" />
                              ) : (
                                <FiChevronRight className="mt-1 shrink-0 text-[#a4afb5] transition group-hover:translate-x-0.5 group-hover:text-[#405b6d]" />
                              )}
                            </button>
                          );
                        })}
                    </div>

                    <button
                      type="button"
                      onClick={viewAllNotifications}
                      className="flex w-full items-center justify-center gap-2 border-t border-[#dfe4e7] bg-[#405b6d] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#2e4353] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
                    >
                      View all notifications
                      <FiChevronRight />
                    </button>
                  </div>
                )}
              </div>
              <span className="mx-1 hidden h-7 w-px bg-[#dde4e8] md:block" />
              <Link
                to="/"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d7e0e5] bg-white px-3 text-sm font-semibold text-[#405b6d] transition hover:border-[#aebcc5] hover:bg-[#f7f9fa]"
              >
                <FiExternalLink />
                <span className="hidden md:inline">View website</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#102b43] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#183d5c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102b43]/30"
              >
                <FiLogOut />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </header>

          <div className="p-6 md:p-10">
            <div className="mb-8 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d3a85f]">
                  HOA Nightmares Admin
                </p>
                <h2 className="mt-3 text-5xl font-light">
                  {isDashboardView
                    ? "Dashboard"
                    : queueConfig[activeQueue].label}
                </h2>
                <p className="mt-3 text-lg text-[#5a6670]">
                  {!isDashboardView && activeQueue === "notifications"
                    ? "Stay up to date with new submissions, publishing activity, and important admin alerts."
                    : "Review submissions, manage workflow states, add notes, and prepare sensitive content before publishing."}
                </p>
                <p className="mt-2 text-sm font-semibold text-[#6a757d]">
                  Backend: {API_BASE_URL || "Local Vite proxy"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isDashboardView) {
                    loadDashboardCounts();
                  } else if (activeQueue === "pages") {
                    loadQueue("pages", {
                      page: currentPage,
                      limit: pageSize,
                      sortOrder: pagesSortOrder,
                      status: statusFilter,
                      search: query,
                    });
                  } else if (activeQueue === "removalRequests") {
                    loadQueue("removalRequests", {
                      page: currentPage,
                      limit: pageSize,
                      search:
                        query.trim() ||
                        (statusFilter === "All" ? "" : statusFilter),
                    });
                  } else {
                    loadQueue(activeQueue, {
                      selectFirst: directEditQueueKeys.includes(activeQueue),
                    });
                  }
                }}
                className="flex w-fit items-center gap-2 rounded border border-[#cfd3d7] bg-white px-4 py-2 font-semibold text-[#405b6d] shadow-sm"
              >
                <FiRefreshCw />
                Refresh
              </button>
              {!isDashboardView && activeQueue === "stories" && (
                <button
                  type="button"
                  onClick={() => switchToQueue("removalRequests")}
                  className="flex w-fit items-center gap-2 rounded border border-[#c8102e] bg-white px-4 py-2 font-semibold text-[#c8102e] shadow-sm hover:bg-red-50"
                >
                  <FiTrash2 />
                  Story Removal Requests
                </button>
              )}
              {!isDashboardView && activeQueue === "faqs" && (
                <button
                  type="button"
                  onClick={startNewFaq}
                  className="flex w-fit items-center gap-2 rounded border border-[#0a6b3b] bg-[#0a6b3b] px-4 py-2 font-semibold text-white shadow-sm"
                >
                  <FiHelpCircle />
                  New FAQ
                </button>
              )}
              {!isDashboardView && activeQueue === "blogs" && (
                <button
                  type="button"
                  onClick={startNewBlog}
                  className="flex w-fit items-center gap-2 rounded border border-[#c8102e] bg-[#c8102e] px-4 py-2 font-semibold text-white shadow-sm"
                >
                  <FiPlus />
                  New Blog
                </button>
              )}
              {!isDashboardView && activeQueue === "pages" && (
                <button
                  type="button"
                  onClick={startNewPage}
                  className="flex w-fit items-center gap-2 rounded border border-[#7b6bb8] bg-[#7b6bb8] px-4 py-2 font-semibold text-white shadow-sm"
                >
                  <FiPlus />
                  New Page
                </button>
              )}
              {!isDashboardView && activeQueue === "resources" && (
                <button
                  type="button"
                  onClick={startNewResource}
                  className="flex w-fit items-center gap-2 rounded border border-[#92753b] bg-[#92753b] px-4 py-2 font-semibold text-white shadow-sm"
                >
                  <FiPlus />
                  New Resource
                </button>
              )}
              {!isDashboardView && activeQueue === "moderation" && (
                <button
                  type="button"
                  onClick={startNewModeration}
                  className="flex w-fit items-center gap-2 rounded border border-[#b95f24] bg-[#b95f24] px-4 py-2 font-semibold text-white shadow-sm"
                >
                  <FiPlus />
                  New Moderation Item
                </button>
              )}
            </div>

            {error && (
              <p className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700">
                {error}
              </p>
            )}
            {message && (
              <p className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 font-semibold text-green-800">
                {message}
              </p>
            )}
            {!isDashboardView &&
              activeRecords.some((record) => record.localOnly) &&
              frontendQueueNotes[activeQueue] && (
                <p className="mb-4 rounded border border-[#ead7a3] bg-[#fff8e5] px-4 py-3 text-sm font-semibold text-[#75520d]">
                  {frontendQueueNotes[activeQueue]}{" "}
                  {isLocalQueueMirrorEnabled()
                    ? "Local mirror is enabled for this browser."
                    : "Enable VITE_ENABLE_LOCAL_ADMIN_QUEUE=true to keep a browser-local queue mirror."}
                </p>
              )}

            {isDashboardView && (
              <div className="space-y-10">
                <section aria-labelledby="dashboard-queues-heading">
                  <div className="mb-4 flex items-end justify-between gap-4 border-b border-[#d9dee2] pb-3">
                    <div>
                      <h3
                        id="dashboard-queues-heading"
                        className="text-2xl font-semibold text-[#2e4353]"
                      >
                        Queues
                      </h3>
                      <p className="mt-1 text-sm text-[#6a757d]">
                        Review and respond to incoming submissions.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-4">
                    {dashboardQueueKeys.map((queue) => {
                      const config = queueConfig[queue];
                      const total = totals[queue]?.total || 0;

                      return (
                        <button
                          type="button"
                          key={queue}
                          onClick={() => switchToQueue(queue)}
                          className="group relative overflow-hidden rounded-xl border border-[#d7dadd] bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#9eabb4] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a8bc1]"
                        >
                          <span
                            className={`absolute inset-x-0 top-0 h-1 ${config.accent}`}
                          />
                          <span className="flex items-start justify-between gap-4">
                            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#f0f4f6] text-xl text-[#405b6d] transition group-hover:bg-[#405b6d] group-hover:text-white">
                              {config.icon}
                            </span>
                            <FiChevronRight className="mt-2 text-xl text-[#9aa5ad] transition group-hover:translate-x-1 group-hover:text-[#405b6d]" />
                          </span>
                          <span className="mt-5 block text-base font-semibold text-[#53616b]">
                            {config.label}
                          </span>
                          <span className="mt-1 block text-4xl font-light text-[#2e4353]">
                            {total}
                          </span>
                          {(totals[queue]?.isPending ||
                            (totals[queue]?.newCount || 0) > 0) && (
                            <span className="mt-2 block text-sm font-medium text-[#6a757d]">
                              {totals[queue]?.isPending
                                ? "Local fallback"
                                : `${totals[queue]?.newCount || 0} new`}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section aria-labelledby="dashboard-managers-heading">
                  <div className="mb-4 border-b border-[#d9dee2] pb-3">
                    <h3
                      id="dashboard-managers-heading"
                      className="text-2xl font-semibold text-[#2e4353]"
                    >
                      Managers
                    </h3>
                    <p className="mt-1 text-sm text-[#6a757d]">
                      Create and maintain published website content.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    {dashboardManagerKeys.map((queue) => {
                      const config = queueConfig[queue];

                      return (
                        <button
                          type="button"
                          key={queue}
                          onClick={() => switchToQueue(queue)}
                          className="group flex items-center gap-4 rounded-xl border border-[#d7dadd] bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#9eabb4] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a8bc1]"
                        >
                          <span
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl text-white ${config.accent}`}
                          >
                            {config.icon}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-lg font-semibold text-[#2e4353]">
                              {config.label}
                            </span>
                            <span className="mt-1 block text-sm text-[#6a757d]">
                              {totals[queue]?.total || 0} published and draft
                              items
                            </span>
                          </span>
                          <FiChevronRight className="shrink-0 text-xl text-[#9aa5ad] transition group-hover:translate-x-1 group-hover:text-[#405b6d]" />
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section aria-labelledby="dashboard-actions-heading">
                  <div className="mb-4 border-b border-[#d9dee2] pb-3">
                    <h3
                      id="dashboard-actions-heading"
                      className="text-2xl font-semibold text-[#2e4353]"
                    >
                      Quick Actions
                    </h3>
                    <p className="mt-1 text-sm text-[#6a757d]">
                      Jump directly to site configuration and page editors.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {dashboardQuickActionKeys.map((queue) => {
                      const config = queueConfig[queue];

                      return (
                        <button
                          type="button"
                          key={queue}
                          onClick={() => switchToQueue(queue)}
                          className="group flex min-h-20 items-center gap-3 rounded-lg border border-[#d7dadd] bg-white px-4 py-3 text-left shadow-sm transition hover:border-[#405b6d] hover:bg-[#f9fbfc] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a8bc1]"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eaf0f3] text-lg text-[#405b6d] transition group-hover:bg-[#405b6d] group-hover:text-white">
                            {config.icon}
                          </span>
                          <span className="min-w-0 flex-1 font-semibold text-[#2e4353]">
                            {config.label}
                          </span>
                          <FiChevronRight className="shrink-0 text-[#9aa5ad] transition group-hover:translate-x-1 group-hover:text-[#405b6d]" />
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section aria-labelledby="dashboard-activity-heading">
                  <div className="mb-4 border-b border-[#d9dee2] pb-3">
                    <h3
                      id="dashboard-activity-heading"
                      className="text-xl font-semibold text-[#2e4353]"
                    >
                      Activity &amp; Resources
                    </h3>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {dashboardActivityKeys.map((queue) => {
                      const config = queueConfig[queue];

                      return (
                        <button
                          type="button"
                          key={queue}
                          onClick={() => switchToQueue(queue)}
                          className="group flex items-center gap-4 rounded-lg border border-[#d7dadd] bg-white px-5 py-4 text-left shadow-sm transition hover:border-[#9eabb4] hover:shadow-md"
                        >
                          <span className="text-2xl text-[#d3a85f]">
                            {config.icon}
                          </span>
                          <span className="flex-1 font-semibold text-[#2e4353]">
                            {config.label}
                          </span>
                          <span className="rounded-full bg-[#eef2f4] px-3 py-1 text-sm font-bold text-[#405b6d]">
                            {totals[queue]?.total || 0}
                          </span>
                          <FiChevronRight className="text-[#9aa5ad] transition group-hover:translate-x-1" />
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            <div
              className={isDashboardView && !selectedRecord ? "hidden" : "mt-8"}
            >
              <section
                className={
                  isDirectEditQueue && selectedRecord
                    ? "hidden"
                    : "rounded border border-[#d7dadd] bg-white shadow-sm"
                }
              >
                <div className="border-b border-[#d7dadd] p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-2xl font-semibold">
                        {queueConfig[activeQueue].label}
                      </h3>
                      <p className="text-sm text-[#6a757d]">
                        {isDirectEditQueue
                          ? "Opening the editor directly for this section."
                          : isServerPaginatedQueue
                            ? `Showing ${visibleStart}-${visibleEnd} of ${pagesPagination.total} records`
                          : isActiveQueuePaginated
                            ? `Showing ${visibleStart}-${visibleEnd} of ${filteredRecords.length} filtered records (${activeRecords.length} total)`
                            : `${filteredRecords.length} visible of ${activeRecords.length} records`}
                      </p>
                    </div>
                    {!isDirectEditQueue && (
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="flex items-center rounded border border-[#cfd3d7] bg-white px-3">
                          <FiSearch className="text-[#8b949b]" />
                          <input
                            value={query}
                            onChange={(event) => {
                              setQuery(event.target.value);
                              setCurrentPage(1);
                            }}
                            placeholder="Search queue"
                            className="w-full px-2 py-2 outline-none"
                          />
                        </div>
                        <select
                          value={statusFilter}
                          onChange={(event) => {
                            setStatusFilter(event.target.value);
                            setCurrentPage(1);
                          }}
                          className="rounded border border-[#cfd3d7] bg-white px-3 py-2 outline-none"
                        >
                          <option value="All">All statuses</option>
                          {queueConfig[activeQueue].statuses.map((status) => (
                            <option key={status} value={status}>
                              {formatStatus(status)}
                            </option>
                          ))}
                        </select>
                        {isPagesQueue && (
                          <select
                            value={pagesSortOrder}
                            onChange={(event) => {
                              setPagesSortOrder(event.target.value);
                              setCurrentPage(1);
                            }}
                            aria-label="Sort pages"
                            className="rounded border border-[#cfd3d7] bg-white px-3 py-2 outline-none"
                          >
                            <option value="desc">Newest first</option>
                            <option value="asc">Oldest first</option>
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {isDirectEditQueue ? (
                  <div className="p-6 text-sm font-semibold text-[#6a757d]">
                    {isLoading
                      ? "Loading editor..."
                      : selectedRecord
                        ? "Editor opened for this section."
                        : "No editable record was returned for this section."}
                  </div>
                ) : activeQueue === "notifications" ? (
                  <div className="bg-[#f7f9fa] p-3 sm:p-5">
                    {isLoading && (
                      <div
                        role="status"
                        className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-xl border border-[#dfe4e7] bg-white text-[#60717c]"
                      >
                        <span className="h-9 w-9 animate-spin rounded-full border-4 border-[#dce4e8] border-t-[#405b6d]" />
                        <span className="font-semibold">
                          Loading notifications...
                        </span>
                      </div>
                    )}

                    {!isLoading && filteredRecords.length === 0 && (
                      <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-[#ccd5da] bg-white px-5 text-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#edf2f4] text-2xl text-[#60717c]">
                          <FiBell />
                        </span>
                        <h4 className="mt-4 text-lg font-bold text-[#2e4353]">
                          No notifications found
                        </h4>
                        <p className="mt-1 max-w-md text-sm text-[#71808a]">
                          You’re all caught up, or no notifications match the
                          selected filter.
                        </p>
                      </div>
                    )}

                    {!isLoading && visibleRecords.length > 0 && (
                      <div className="overflow-hidden rounded-xl border border-[#d9e0e4] bg-white shadow-sm">
                        {visibleRecords.map((record) => (
                          <article
                            key={getRecordKey(record)}
                            className={`group relative border-b border-[#e8ecef] last:border-b-0 ${
                              record.isRead ? "bg-white" : "bg-[#f3f8fb]"
                            }`}
                          >
                            {!record.isRead && (
                              <span className="absolute inset-y-0 left-0 w-1 bg-[#4a8bc1]" />
                            )}
                            <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                              <span
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg ${
                                  record.isRead
                                    ? "bg-[#edf1f3] text-[#71808a]"
                                    : "bg-[#dfeef7] text-[#367aa9]"
                                }`}
                              >
                                <FiBell />
                              </span>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4
                                    className={`text-base text-[#2e4353] ${
                                      record.isRead
                                        ? "font-semibold"
                                        : "font-bold"
                                    }`}
                                  >
                                    {record.title || "Admin notification"}
                                  </h4>
                                  {!record.isRead && (
                                    <span className="h-2 w-2 rounded-full bg-[#e64863]" />
                                  )}
                                </div>
                                {record.description && (
                                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#60717c]">
                                    {record.description}
                                  </p>
                                )}
                                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-[#819099]">
                                  <span className="capitalize">
                                    {record.relatedModule ||
                                      "System notification"}
                                  </span>
                                  <span aria-hidden="true">•</span>
                                  <time>
                                    ReceivedAt: {formatDate(record.created_at)}
                                  </time>
                                </div>
                              </div>

                              <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                                    record.isRead
                                      ? "bg-[#edf1f3] text-[#60717c]"
                                      : "bg-[#e1eff7] text-[#2f6f99]"
                                  }`}
                                >
                                  {record.isRead ? "Read" : "Unread"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openRecord(activeQueue, record)
                                  }
                                  className="inline-flex items-center gap-2 rounded-lg border border-[#c7d3da] bg-white px-4 py-2 text-sm font-bold text-[#405b6d] shadow-sm transition hover:border-[#405b6d] hover:bg-[#405b6d] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a8bc1]"
                                >
                                  <FiEye />
                                  View
                                </button>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left">
                      <thead className="border-b border-[#d7dadd] bg-[#f7f8f9]">
                        <tr>
                          <th className="px-5 py-3">#</th>
                          <th className="px-5 py-3">Title</th>
                          <th className="px-5 py-3">Submitted By</th>
                          <th className="px-5 py-3">Status</th>
                          {activeQueue !== "faqs" && (
                            <th className="px-5 py-3">Created</th>
                          )}
                          <th className="px-5 py-3">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading && (
                          <tr>
                            <td
                              className="px-5 py-8 text-center"
                              colSpan={activeQueue === "faqs" ? 5 : 6}
                            >
                              Loading queue records...
                            </td>
                          </tr>
                        )}
                        {!isLoading &&
                          filteredRecords.length === 0 &&
                          (frontendQueueNotes[activeQueue] ? (
                            <tr>
                              <td
                                className="px-5 py-8 text-center"
                                colSpan={activeQueue === "faqs" ? 5 : 6}
                              >
                                {frontendQueueNotes[activeQueue]}
                              </td>
                            </tr>
                          ) : (
                            <tr>
                              <td
                                className="px-5 py-8 text-center"
                                colSpan={activeQueue === "faqs" ? 5 : 6}
                              >
                                No records match the current filters.
                              </td>
                            </tr>
                          ))}
                        {!isLoading &&
                          visibleRecords.map((record, index) => (
                            <tr
                              key={getRecordKey(record)}
                              className="border-b border-[#e5e5e5] last:border-b-0"
                            >
                              <td className="px-5 py-4">
                                {paginationStart + index + 1}
                              </td>
                              <td className="max-w-[260px] px-5 py-4">
                                <p className="truncate font-semibold">
                                  {queueConfig[activeQueue].title(record) ||
                                    "Untitled"}
                                </p>
                                <p className="truncate text-sm text-[#6a757d]">
                                  {queueConfig[activeQueue].meta(record) ||
                                    "No meta"}
                                </p>
                              </td>
                              <td className="px-5 py-4">
                                <p>{queueConfig[activeQueue].person(record)}</p>
                                <p className="text-sm text-[#6a757d]">
                                  {queueConfig[activeQueue].email(record)}
                                </p>
                              </td>
                              <td className="px-5 py-4">
                                <span className="rounded-full bg-[#eef4f8] px-3 py-1 text-sm font-semibold text-[#405b6d] whitespace-nowrap text-[12px]">
                                  {formatStatus(record.status)}
                                </span>
                              </td>
                              {activeQueue !== "faqs" && (
                                <td className="px-5 py-4 text-sm">
                                  {formatDate(record.created_at)}
                                </td>
                              )}
                              <td className="px-5 py-4">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openRecord(activeQueue, record)
                                  }
                                  className="rounded bg-[#4a8bc1] px-4 py-1.5 text-sm font-semibold text-white"
                                >
                                  {activeQueue === "notifications"
                                    ? "View"
                                    : activeQueue === "removalRequests"
                                      ? "Review"
                                    : "Edit"}
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {!isDirectEditQueue &&
                  isActiveQueuePaginated &&
                  filteredRecords.length > 0 && (
                    <div className="flex flex-col gap-3 border-t border-[#d7dadd] p-4 text-sm text-[#405b6d] md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Rows per page</span>
                        <select
                          value={pageSize}
                          onChange={(event) => {
                            setPageSize(Number(event.target.value));
                            setCurrentPage(1);
                          }}
                          className="rounded border border-[#cfd3d7] bg-white px-2 py-1.5 outline-none"
                        >
                          {pageSizeOptions.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <span className="font-semibold">
                          Page {safeCurrentPage} of {totalPages}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCurrentPage(1)}
                            disabled={safeCurrentPage === 1}
                            className="rounded border border-[#cfd3d7] px-3 py-1.5 font-semibold text-[#2f4251] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            First
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCurrentPage(Math.max(1, safeCurrentPage - 1))
                            }
                            disabled={safeCurrentPage === 1}
                            className="rounded border border-[#cfd3d7] px-3 py-1.5 font-semibold text-[#2f4251] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Previous
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCurrentPage(
                                Math.min(totalPages, safeCurrentPage + 1),
                              )
                            }
                            disabled={safeCurrentPage === totalPages}
                            className="rounded border border-[#cfd3d7] px-3 py-1.5 font-semibold text-[#2f4251] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Next
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={safeCurrentPage === totalPages}
                            className="rounded border border-[#cfd3d7] px-3 py-1.5 font-semibold text-[#2f4251] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Last
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
              </section>

              {selectedRecord && selectedConfig && (
                <div
                  className={
                    isSelectedRecordDirectEdit
                      ? "mt-8 rounded border border-[#d7dadd] bg-white p-5 shadow-sm"
                      : "fixed inset-0 z-[80] flex items-stretch justify-center bg-black/50 p-0 sm:p-4"
                  }
                  {...(!isSelectedRecordDirectEdit
                    ? { role: "dialog", "aria-modal": "true" }
                    : {})}
                >
                  <aside
                    className={
                      isSelectedRecordDirectEdit
                        ? "w-full"
                        : selectedRecord.queue === "notifications"
                          ? "my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-none border border-[#d7dadd] bg-white p-5 shadow-2xl sm:rounded-xl sm:p-6"
                          : "h-full max-h-full w-full max-w-5xl overflow-y-auto rounded-none border border-[#d7dadd] bg-white p-5 shadow-2xl sm:rounded"
                    }
                  >
                    {!selectedRecord ? (
                      <div className="flex min-h-[360px] items-center justify-center text-center text-[#6a757d]">
                        <div>
                          <p className="text-xl font-semibold text-[#2f4251]">
                            Select a record
                          </p>
                          <p className="mt-2">
                            Open any queue item to review details, update
                            status, edit supported fields, and save backend
                            workflow changes.
                          </p>
                        </div>
                      </div>
                    ) : isRecordDetailsLoading ? (
                      <div
                        role="status"
                        className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center text-[#60717c]"
                      >
                        <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#dce4e8] border-t-[#405b6d]" />
                        <p className="font-semibold">
                          Loading record details...
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-5 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#d3a85f]">
                              {selectedConfig.label}
                            </p>
                            <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                              <h3 className="text-2xl font-semibold">
                                {selectedConfig.title(selectedRecord) ||
                                  "Untitled"}
                              </h3>
                              {queuesWithLastUpdated.has(
                                selectedRecord.queue,
                              ) &&
                                selectedRecord.updatedAt && (
                                  <p className="text-xs font-semibold text-[#6a757d]">
                                    Last updated:{" "}
                                    <time dateTime={selectedRecord.updatedAt}>
                                      {formatDate(selectedRecord.updatedAt)}
                                    </time>
                                  </p>
                                )}
                            </div>
                          </div>
                          {!isSelectedRecordDirectEdit && (
                            <button
                              type="button"
                              onClick={() => setSelectedRecord(null)}
                              className="text-sm font-semibold text-[#4a8bc1]"
                            >
                              Close
                            </button>
                          )}
                        </div>

                        {/* {isFrontendManagedQueue(selectedRecord.queue) && (
                      <div className="mt-5 rounded border border-[#ead7a3] bg-[#fff8e5] px-4 py-3 text-sm font-semibold text-[#75520d]">
                        This queue is frontend-managed until the backend admin
                        API is added. No database id is shown in the UI.
                      </div>
                    )} */}

                        {selectedRecord.queue === "stories" && (
                          <div className="mt-5 space-y-4">
                            <label className="block rounded-lg border border-[#c8d8ce] bg-[#f3f8f5] p-4 text-sm font-semibold text-[#164c32]">
                              Case ID
                              <input
                                value={selectedRecord.caseId || "Not assigned"}
                                readOnly
                                aria-label="Story Case ID"
                                className="mt-2 w-full rounded border border-[#b8cfc0] bg-white px-3 py-2 font-mono font-semibold tracking-wide text-[#2f4251] outline-none"
                              />
                              <span className="mt-2 block text-xs font-normal text-[#60717c]">
                                This identifier is generated for the story and
                                cannot be changed.
                              </span>
                            </label>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <label className="block text-sm font-semibold">
                                Story Name
                                <input
                                  value={selectedRecord.story_name || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "story_name",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                              <label className="block text-sm font-semibold">
                                HOA / Community
                                <input
                                  value={selectedRecord.story_hoa_name || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "story_hoa_name",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <label className="block text-sm font-semibold">
                                State
                                <select
                                  value={selectedRecord.story_state || ""}
                                  onChange={(event) =>
                                    updateSelectedRecord((record) => ({
                                      ...record,
                                      story_state: event.target.value,
                                      story_city: "",
                                    }))
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] bg-white px-3 py-2 font-normal"
                                >
                                  <option value="">Select State</option>
                                  {selectedRecord.story_state &&
                                    !US_STATE_OPTIONS.includes(
                                      selectedRecord.story_state,
                                    ) && (
                                      <option value={selectedRecord.story_state}>
                                        {selectedRecord.story_state}
                                      </option>
                                    )}
                                  {US_STATE_OPTIONS.map((stateName) => (
                                    <option key={stateName} value={stateName}>
                                      {stateName}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="block text-sm font-semibold">
                                City
                                <select
                                  value={selectedRecord.story_city || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "story_city",
                                      event.target.value,
                                    )
                                  }
                                  disabled={!selectedRecord.story_state}
                                  className={`mt-2 w-full rounded border border-[#cfd3d7] bg-white px-3 py-2 font-normal ${
                                    !selectedRecord.story_state
                                      ? "cursor-not-allowed opacity-60"
                                      : ""
                                  }`}
                                >
                                  <option value="">
                                    {selectedRecord.story_state
                                      ? "Select City"
                                      : "Select State First"}
                                  </option>
                                  {selectedRecord.story_city &&
                                    !getCitiesForState(
                                      selectedRecord.story_state,
                                    ).includes(selectedRecord.story_city) && (
                                      <option value={selectedRecord.story_city}>
                                        {selectedRecord.story_city}
                                      </option>
                                    )}
                                  {getCitiesForState(
                                    selectedRecord.story_state,
                                  ).map((cityName) => (
                                    <option key={cityName} value={cityName}>
                                      {cityName}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>

                            <fieldset className="block text-sm font-semibold">
                              <legend>Issue Types</legend>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {STORY_ISSUE_TYPES.map((issueType) => {
                                  const selectedIssueTypes =
                                    getStoryIssueTypes(selectedRecord);
                                  const isSelected =
                                    selectedIssueTypes.includes(
                                      issueType.value,
                                    );

                                  return (
                                    <label
                                      key={issueType.value}
                                      className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                                        isSelected
                                          ? "border-[#405b6d] bg-[#405b6d] text-white"
                                          : "border-[#cfd3d7] bg-white text-[#405b6d] hover:border-[#405b6d]"
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {
                                          const nextIssueTypes = isSelected
                                            ? selectedIssueTypes.filter(
                                                (value) =>
                                                  value !== issueType.value,
                                              )
                                            : [
                                                ...selectedIssueTypes,
                                                issueType.value,
                                              ];
                                          updateSelectedRecord((record) => ({
                                            ...record,
                                            story_issue_type: nextIssueTypes,
                                            storyIssuesInput: nextIssueTypes,
                                          }));
                                        }}
                                        className="sr-only"
                                      />
                                      {issueType.label}
                                    </label>
                                  );
                                })}
                              </div>
                            </fieldset>

                            <label className="block text-sm font-semibold">
                              Story Summary
                              <textarea
                                value={selectedRecord.story_summary || ""}
                                onChange={(event) =>
                                  updateSelectedField(
                                    "story_summary",
                                    event.target.value,
                                  )
                                }
                                rows={3}
                                maxLength={300}
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                              />
                              <span className="mt-1 block text-xs font-semibold text-[#6a757d]">
                                {(selectedRecord.story_summary || "").length}
                                /300
                              </span>
                            </label>

                            <label className="block text-sm font-semibold">
                              Full Story
                              <textarea
                                value={selectedRecord.story_body || ""}
                                onChange={(event) =>
                                  updateSelectedField(
                                    "story_body",
                                    event.target.value,
                                  )
                                }
                                rows={7}
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                              />
                            </label>

                            <label className="flex items-center gap-3 text-sm font-semibold">
                              <input
                                type="checkbox"
                                checked={Boolean(
                                  selectedRecord.story_anonymous,
                                )}
                                onChange={(event) =>
                                  updateSelectedField(
                                    "story_anonymous",
                                    event.target.checked,
                                  )
                                }
                                className="h-4 w-4 rounded border-[#cfd3d7]"
                              />
                              Publish anonymously
                            </label>

                            <label className="block text-sm font-semibold">
                              Admin Notes
                              <textarea
                                value={selectedRecord.adminNotes || ""}
                                onChange={(event) =>
                                  updateSelectedField(
                                    "adminNotes",
                                    event.target.value,
                                  )
                                }
                                rows={4}
                                placeholder="Private admin notes for this story"
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                              />
                            </label>

                            {selectedRecord.status === "flagged" && (
                              <label className="block text-sm font-semibold">
                                Flag Reason
                                <textarea
                                  value={selectedRecord.flagReason || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "flagReason",
                                      event.target.value,
                                    )
                                  }
                                  rows={3}
                                  placeholder="Reason shown in the flagged workflow"
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                            )}
                          </div>
                        )}

                        {selectedRecord.queue === "removalRequests" && (
                          <div className="mt-5 space-y-5">
                            <div className="rounded-lg border border-[#e1e5e8] bg-[#f8fafb] p-4">
                              <div className="grid gap-4 md:grid-cols-2">
                                <label className="block text-sm font-semibold">
                                  Case ID
                                  <input
                                    value={selectedRecord.caseId || ""}
                                    readOnly
                                    className="mt-2 w-full rounded border border-[#cfd3d7] bg-white px-3 py-2 font-mono font-normal"
                                  />
                                </label>
                                <label className="block text-sm font-semibold">
                                  Requester
                                  <input
                                    value={selectedRecord.name || ""}
                                    readOnly
                                    className="mt-2 w-full rounded border border-[#cfd3d7] bg-white px-3 py-2 font-normal"
                                  />
                                </label>
                                <label className="block text-sm font-semibold md:col-span-2">
                                  Email
                                  <input
                                    value={selectedRecord.email || ""}
                                    readOnly
                                    className="mt-2 w-full rounded border border-[#cfd3d7] bg-white px-3 py-2 font-normal"
                                  />
                                </label>
                              </div>
                              <label className="mt-4 block text-sm font-semibold">
                                Removal Reason
                                <textarea
                                  value={selectedRecord.reason || ""}
                                  readOnly
                                  rows={5}
                                  className="mt-2 w-full rounded border border-[#cfd3d7] bg-white px-3 py-2 font-normal"
                                />
                              </label>
                            </div>

                            <button
                              type="button"
                              onClick={reviewRemovalRequestStory}
                              disabled={isSaving || !selectedRecord.caseId}
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0a6b3b] px-5 py-3 font-bold text-white transition hover:bg-[#07552f] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <FiEdit3 aria-hidden="true" />
                              {isSaving ? "Loading Story..." : "Review Story"}
                            </button>

                            {selectedRecord.status === "new" ? (
                              <div className="rounded-lg border border-[#ecd3d8] bg-[#fffafb] p-4">
                                <label className="block text-sm font-semibold">
                                  Rejection Reason
                                  <textarea
                                    value={
                                      selectedRecord.rejectionReason || ""
                                    }
                                    onChange={(event) =>
                                      updateSelectedField(
                                        "rejectionReason",
                                        event.target.value,
                                      )
                                    }
                                    rows={4}
                                    placeholder="Required only when rejecting the request"
                                  className="mt-2 w-full rounded border border-[#cfd3d7] bg-white px-3 py-2 font-normal"
                                />
                              </label>
                                <div
                                  role="alert"
                                  className="mt-4 flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
                                >
                                  <FiAlertTriangle
                                    className="mt-0.5 shrink-0 text-lg"
                                    aria-hidden="true"
                                  />
                                  <p>
                                    <strong>Permanent removal:</strong> Once
                                    this story is removed, it cannot be restored
                                    or recovered.
                                  </p>
                                </div>
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                  <button
                                    type="button"
                                    onClick={rejectStoryRemoval}
                                    disabled={isSaving}
                                    className="rounded-lg border border-red-300 bg-white px-4 py-3 font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
                                  >
                                    Reject Request
                                  </button>
                                  <button
                                    type="button"
                                    onClick={completeStoryRemoval}
                                    disabled={isSaving}
                                    className="rounded-lg bg-[#c8102e] px-4 py-3 font-bold text-white hover:bg-[#a30d25] disabled:opacity-60"
                                  >
                                    Remove Story
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-lg border border-[#d7dadd] bg-[#f7f8f9] p-4 text-sm">
                                <p className="font-bold">
                                  Request {formatStatus(selectedRecord.status)}
                                </p>
                                {selectedRecord.rejectionReason && (
                                  <p className="mt-2 leading-6 text-[#5f6d75]">
                                    Rejection reason:{" "}
                                    {selectedRecord.rejectionReason}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {selectedRecord.queue === "contact" && (
                          <div className="mt-5 space-y-4">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <label className="block text-sm font-semibold">
                                Name
                                <input
                                  value={selectedRecord.contact_name || ""}
                                  readOnly
                                  className="mt-2 w-full rounded border border-[#cfd3d7] bg-[#f7f8f9] px-3 py-2 font-normal text-[#405b6d]"
                                />
                              </label>
                              <label className="block text-sm font-semibold">
                                Email
                                <input
                                  value={selectedRecord.contact_email || ""}
                                  readOnly
                                  className="mt-2 w-full rounded border border-[#cfd3d7] bg-[#f7f8f9] px-3 py-2 font-normal text-[#405b6d]"
                                />
                              </label>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <label className="block text-sm font-semibold">
                                Phone
                                <input
                                  value={selectedRecord.contact_phone || ""}
                                  readOnly
                                  className="mt-2 w-full rounded border border-[#cfd3d7] bg-[#f7f8f9] px-3 py-2 font-normal text-[#405b6d]"
                                />
                              </label>
                              <label className="block text-sm font-semibold">
                                Subject
                                <input
                                  value={selectedRecord.contact_subject || ""}
                                  readOnly
                                  className="mt-2 w-full rounded border border-[#cfd3d7] bg-[#f7f8f9] px-3 py-2 font-normal text-[#405b6d]"
                                />
                              </label>
                            </div>

                            <label className="block text-sm font-semibold">
                              Message
                              <textarea
                                value={selectedRecord.contact_message || ""}
                                rows={6}
                                readOnly
                                className="mt-2 w-full rounded border border-[#cfd3d7] bg-[#f7f8f9] px-3 py-2 font-normal text-[#405b6d]"
                              />
                            </label>
                          </div>
                        )}

                        {selectedRecord.queue === "advocate" && (
                          <div className="mt-5 space-y-4">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <label className="block text-sm font-semibold">
                                Name
                                <input
                                  value={selectedRecord.adv_name || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "adv_name",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                              <label className="block text-sm font-semibold">
                                Email
                                <input
                                  value={selectedRecord.adv_email || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "adv_email",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                              <label className="block text-sm font-semibold">
                                Phone
                                <input
                                  value={selectedRecord.adv_phone || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "adv_phone",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                              <label className="block text-sm font-semibold">
                                State
                                <input
                                  value={selectedRecord.adv_state || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "adv_state",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                              <label className="block text-sm font-semibold">
                                HOA / Community
                                <input
                                  value={selectedRecord.adv_hoa_name || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "adv_hoa_name",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                              <label className="block text-sm font-semibold">
                                Best Time to Call
                                <select
                                  value={
                                    selectedRecord.adv_best_time_to_call || ""
                                  }
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "adv_best_time_to_call",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                >
                                  <option value="" disabled>
                                    Not specified
                                  </option>
                                  <option value="morning">Morning</option>
                                  <option value="afternoon">Afternoon</option>
                                  <option value="evening">Evening</option>
                                  <option value="night">Night</option>
                                </select>
                              </label>
                            </div>

                            <fieldset className="block text-sm font-semibold">
                              <legend>Issue Types</legend>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {ADVOCATE_ISSUE_TYPES.map((issueType) => {
                                  const selectedIssueTypes =
                                    getAdvocateIssueTypes(selectedRecord);
                                  const isSelected =
                                    selectedIssueTypes.includes(
                                      issueType.value,
                                    );

                                  return (
                                    <label
                                      key={issueType.value}
                                      className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                                        isSelected
                                          ? "border-[#405b6d] bg-[#405b6d] text-white"
                                          : "border-[#cfd3d7] bg-white text-[#405b6d] hover:border-[#405b6d]"
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() =>
                                          updateSelectedField(
                                            "adv_issue_types",
                                            isSelected
                                              ? selectedIssueTypes.filter(
                                                  (value) =>
                                                    value !== issueType.value,
                                                )
                                              : [
                                                  ...selectedIssueTypes,
                                                  issueType.value,
                                                ],
                                          )
                                        }
                                        className="sr-only"
                                      />
                                      {issueType.label}
                                    </label>
                                  );
                                })}
                              </div>
                            </fieldset>

                            <label className="block text-sm font-semibold">
                              Issue Summary
                              <textarea
                                value={selectedRecord.adv_issue_summary || ""}
                                onChange={(event) =>
                                  updateSelectedField(
                                    "adv_issue_summary",
                                    event.target.value,
                                  )
                                }
                                rows={5}
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                              />
                            </label>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <label className="block text-sm font-semibold">
                                Estimated Damages
                                <input
                                  value={
                                    selectedRecord.adv_estimated_damages || ""
                                  }
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "adv_estimated_damages",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                              <label className="block text-sm font-semibold">
                                Key Dates / Other Details
                                <input
                                  value={selectedRecord.adv_key_dates || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "adv_key_dates",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                            </div>

                            {getAdvocateUploads(selectedRecord).length > 0 && (
                              <div className="block text-sm font-semibold">
                                Uploads
                                <div className="mt-2 max-h-72 space-y-2 overflow-y-auto rounded border border-[#e5e5e5] bg-[#f8fafb] p-2">
                                  {getAdvocateUploads(selectedRecord).map(
                                    (upload, index) => {
                                      const fileUrl =
                                        getAdvocateUploadUrl(upload);
                                      const fileLabel =
                                        getAdvocateUploadLabel(upload);

                                      return (
                                        <div
                                          key={
                                            fileUrl ||
                                            `${fileLabel}-${index}`
                                          }
                                          className="flex items-center gap-2 rounded border border-[#e5e5e5] bg-white px-3 py-2 font-normal"
                                        >
                                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eaf1f6] text-xs font-bold text-[#405b6d]">
                                            {index + 1}
                                          </span>
                                          {fileUrl ? (
                                            <a
                                              href={buildAssetUrl(fileUrl)}
                                              target="_blank"
                                              rel="noreferrer"
                                              title={fileLabel}
                                              className="min-w-0 truncate text-[#405b6d] underline-offset-2 hover:underline"
                                            >
                                              {fileLabel}
                                            </a>
                                          ) : (
                                            <span className="min-w-0 truncate text-[#405b6d]">
                                              {fileLabel}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    },
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {selectedRecord.queue === "moderation" && (
                          <div className="mt-5 space-y-4">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <label className="block text-sm font-semibold">
                                Title
                                <input
                                  value={selectedRecord.moderation_title || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "moderation_title",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                              <label className="block text-sm font-semibold">
                                Reason
                                <input
                                  value={selectedRecord.reason || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "reason",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <label className="block text-sm font-semibold">
                                Source Queue
                                <input
                                  value={selectedRecord.source_queue || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "source_queue",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="stories, contact, advocate, attorneys"
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                              <label className="block text-sm font-semibold">
                                Source Label
                                <input
                                  value={selectedRecord.source_label || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "source_label",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Visible reference, no id required"
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                            </div>

                            <label className="block text-sm font-semibold">
                              Summary
                              <textarea
                                value={selectedRecord.moderation_summary || ""}
                                onChange={(event) =>
                                  updateSelectedField(
                                    "moderation_summary",
                                    event.target.value,
                                  )
                                }
                                rows={5}
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                              />
                            </label>

                            <label className="block text-sm font-semibold">
                              Internal Notes
                              <textarea
                                value={selectedRecord.internal_notes || ""}
                                onChange={(event) =>
                                  updateSelectedField(
                                    "internal_notes",
                                    event.target.value,
                                  )
                                }
                                rows={4}
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                              />
                            </label>
                          </div>
                        )}

                        {selectedRecord.queue === "faqs" && (
                          <div className="mt-5 space-y-4">
                            <label className="block text-sm font-semibold">
                              Question
                              <input
                                value={selectedRecord.question || ""}
                                onChange={(event) =>
                                  updateSelectedField(
                                    "question",
                                    event.target.value,
                                  )
                                }
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                              />
                            </label>
                            <label className="block text-sm font-semibold">
                              Answer
                              <textarea
                                value={selectedRecord.answer || ""}
                                onChange={(event) =>
                                  updateSelectedField(
                                    "answer",
                                    event.target.value,
                                  )
                                }
                                rows={5}
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                              />
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              <label className="block text-sm font-semibold">
                                Category
                                <input
                                  value={selectedRecord.category || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "category",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                              <label className="block text-sm font-semibold">
                                Sort Order
                                <input
                                  type="number"
                                  min="0"
                                  value={selectedRecord.sortOrder || 0}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "sortOrder",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                            </div>
                          </div>
                        )}

                        {selectedRecord.queue === "attorneys" && (
                          <div className="mt-5 space-y-4">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <label className="block text-sm font-semibold">
                                Attorney Name
                                <input
                                  value={selectedRecord.attorney_name || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "attorney_name",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                              <label className="block text-sm font-semibold">
                                Firm
                                <input
                                  value={selectedRecord.attorney_firm || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "attorney_firm",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <label className="block text-sm font-semibold">
                                Email
                                <input
                                  value={selectedRecord.attorney_email || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "attorney_email",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                              <label className="block text-sm font-semibold">
                                Phone
                                <input
                                  value={selectedRecord.attorney_phone || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "attorney_phone",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                            </div>

                            <label className="block text-sm font-semibold">
                              Website
                              <input
                                value={selectedRecord.attorney_website || ""}
                                onChange={(event) =>
                                  updateSelectedField(
                                    "attorney_website",
                                    event.target.value,
                                  )
                                }
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                              />
                            </label>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                              <label className="block text-sm font-semibold">
                                City
                                <input
                                  value={selectedRecord.attorney_city || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "attorney_city",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                              <label className="block text-sm font-semibold">
                                State
                                <input
                                  value={selectedRecord.attorney_state || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "attorney_state",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                              <label className="block text-sm font-semibold">
                                County
                                <input
                                  value={selectedRecord.attorney_county || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "attorney_county",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                            </div>

                            <fieldset className="block text-sm font-semibold">
                              <legend>Practice Areas</legend>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {ATTORNEY_PRACTICE_AREAS.map(
                                  (practiceArea) => {
                                    const selectedPracticeAreas =
                                      getAttorneyPracticeAreas(selectedRecord);
                                    const isSelected =
                                      selectedPracticeAreas.includes(
                                        practiceArea,
                                      );

                                    return (
                                      <label
                                        key={practiceArea}
                                        className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                                          isSelected
                                            ? "border-[#405b6d] bg-[#405b6d] text-white"
                                            : "border-[#cfd3d7] bg-white text-[#405b6d] hover:border-[#405b6d]"
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => {
                                            const nextPracticeAreas = isSelected
                                              ? selectedPracticeAreas.filter(
                                                  (value) =>
                                                    value !== practiceArea,
                                                )
                                              : [
                                                  ...selectedPracticeAreas,
                                                  practiceArea,
                                                ];
                                            updateSelectedRecord((record) => ({
                                              ...record,
                                              attorney_practice_areas:
                                                nextPracticeAreas,
                                              practiceAreasInput:
                                                nextPracticeAreas,
                                            }));
                                          }}
                                          className="sr-only"
                                        />
                                        {practiceArea}
                                      </label>
                                    );
                                  },
                                )}
                              </div>
                            </fieldset>

                            <label className="block text-sm font-semibold">
                              Listing Summary
                              <textarea
                                value={selectedRecord.attorney_summary || ""}
                                onChange={(event) =>
                                  updateSelectedField(
                                    "attorney_summary",
                                    event.target.value,
                                  )
                                }
                                rows={4}
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                              />
                            </label>

                            <label className="block text-sm font-semibold">
                              Full Bio
                              <textarea
                                value={selectedRecord.attorney_bio || ""}
                                onChange={(event) =>
                                  updateSelectedField(
                                    "attorney_bio",
                                    event.target.value,
                                  )
                                }
                                rows={5}
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                              />
                            </label>

                            {selectedRecord.status === "declined" && (
                              <label className="block text-sm font-semibold">
                                Decline Reason
                                <textarea
                                  value={selectedRecord.declineReason || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "declineReason",
                                      event.target.value,
                                    )
                                  }
                                  rows={3}
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                            )}
                          </div>
                        )}

                        {selectedRecord.queue === "blogs" && (
                          <div className="mt-5 space-y-4">
                            <label className="block text-sm font-semibold">
                              Title
                              <input
                                value={selectedRecord.title || ""}
                                onChange={(event) =>
                                  updateSelectedField(
                                    "title",
                                    event.target.value,
                                  )
                                }
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                              />
                            </label>

                            {selectedRecord.id ? (
                              <label className="block text-sm font-semibold">
                                Slug
                                <input
                                  value={selectedRecord.slug || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "slug",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                            ) : (
                              <p className="rounded bg-[#f7f8f9] px-3 py-2 text-xs font-semibold text-[#6a757d]">
                                Slug will be generated by the backend from the
                                title.
                              </p>
                            )}

                            <label className="block text-sm font-semibold">
                              Excerpt
                              <textarea
                                value={selectedRecord.excerpt || ""}
                                onChange={(event) =>
                                  updateSelectedField(
                                    "excerpt",
                                    event.target.value,
                                  )
                                }
                                rows={3}
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                              />
                            </label>

                            <RichTextEditor
                              key={`${selectedRecord.id || selectedRecord.draftKey || "new-blog"}-body`}
                              label="Body"
                              value={selectedRecord.body || ""}
                              onChange={(value) =>
                                updateSelectedField("body", value)
                              }
                            />

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <label className="block text-sm font-semibold">
                                Category
                                <input
                                  value={selectedRecord.category || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "category",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                              <label className="block text-sm font-semibold">
                                Tags
                                <input
                                  value={getTagsInput(selectedRecord)}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "tagsInput",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Comma separated"
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                            </div>

                            <label className="block text-sm font-semibold">
                              Banner / Featured Image
                              {selectedRecord.featured_image && (
                                <img
                                  src={buildAssetUrl(
                                    selectedRecord.featured_image,
                                  )}
                                  alt=""
                                  className="mt-2 h-32 w-full rounded border border-[#d7dadd] object-cover"
                                />
                              )}
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                onChange={(event) =>
                                  updateSelectedField(
                                    "featuredImageFile",
                                    event.target.files?.[0] || null,
                                  )
                                }
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 text-sm font-normal"
                              />
                              {selectedRecord.featuredImageFile && (
                                <span className="mt-1 block text-xs font-semibold text-[#6a757d]">
                                  Selected:{" "}
                                  {selectedRecord.featuredImageFile.name}
                                </span>
                              )}
                              {!selectedRecord.id &&
                                !selectedRecord.featuredImageFile && (
                                  <span className="mt-1 block text-xs font-semibold text-[#c8102e]">
                                    Required for new blog posts.
                                  </span>
                                )}
                            </label>

                            <label className="block text-sm font-semibold">
                              SEO Title
                              <input
                                value={selectedRecord.seo_title || ""}
                                onChange={(event) =>
                                  updateSelectedField(
                                    "seo_title",
                                    event.target.value,
                                  )
                                }
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                              />
                            </label>

                            <label className="block text-sm font-semibold">
                              Meta Description
                              <textarea
                                value={selectedRecord.meta_description || ""}
                                onChange={(event) =>
                                  updateSelectedField(
                                    "meta_description",
                                    event.target.value,
                                  )
                                }
                                rows={3}
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                              />
                            </label>
                          </div>
                        )}

                        {selectedRecord.queue === "pages" && (
                          <div className="mt-5 space-y-4">
                            <label className="block text-sm font-semibold">
                              Page Title
                              <input
                                value={selectedRecord.title || ""}
                                onChange={(event) => {
                                  const title = event.target.value;
                                  updateSelectedRecord((record) => {
                                    const shouldGenerateSlug =
                                      record.slugAutoGenerated ||
                                      !String(record.slug || "").trim();
                                    return {
                                      ...record,
                                      title,
                                      slug: shouldGenerateSlug
                                        ? createSlug(title)
                                        : record.slug,
                                      slugAutoGenerated: shouldGenerateSlug,
                                    };
                                  });
                                }}
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                              />
                            </label>

                            <label className="block text-sm font-semibold">
                              Slug
                              <input
                                value={selectedRecord.slug || ""}
                                onChange={(event) =>
                                  updateSelectedRecord((record) => ({
                                    ...record,
                                    slug: createSlug(event.target.value),
                                    slugAutoGenerated: false,
                                  }))
                                }
                                placeholder="Generated from the title when empty"
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                              />
                              <span className="mt-1 block text-xs font-medium text-[#6a757d]">
                                Existing slugs are preserved. Leave this empty
                                to let the backend generate one.
                              </span>
                            </label>

                            <label className="block text-sm font-semibold">
                              Hero Title
                              <input
                                value={selectedRecord.hero_title || ""}
                                onChange={(event) =>
                                  updateSelectedField(
                                    "hero_title",
                                    event.target.value,
                                  )
                                }
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                              />
                            </label>

                            <RichTextEditor
                              key={`${selectedRecord.id || selectedRecord.draftKey || "new-page"}-hero-body`}
                              label="Hero Body"
                              value={selectedRecord.hero_body || ""}
                              onChange={(value) =>
                                updateSelectedField("hero_body", value)
                              }
                            />

                            <label className="block text-sm font-semibold">
                              SEO Title
                              <input
                                value={selectedRecord.seo_title || ""}
                                onChange={(event) =>
                                  updateSelectedField(
                                    "seo_title",
                                    event.target.value,
                                  )
                                }
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                              />
                            </label>

                            <label className="block text-sm font-semibold">
                              Meta Description
                              <textarea
                                value={selectedRecord.meta_description || ""}
                                onChange={(event) =>
                                  updateSelectedField(
                                    "meta_description",
                                    event.target.value,
                                  )
                                }
                                rows={3}
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                              />
                            </label>
                          </div>
                        )}

                        {selectedRecord.queue === "resources" && (
                          <div className="mt-5 space-y-4">
                            {selectedRecord.resourceDetailsLimited && (
                              <div className="rounded border border-[#ead7a3] bg-[#fff8e5] px-4 py-3 text-sm font-semibold text-[#75520d]">
                                Backend does not expose a resource detail
                                endpoint yet. Draft/review resources may need
                                summary, body, SEO, and files re-entered before
                                saving.
                              </div>
                            )}

                            <label className="block text-sm font-semibold">
                              Resource Title
                              <input
                                value={selectedRecord.title || ""}
                                onChange={(event) =>
                                  updateSelectedField(
                                    "title",
                                    event.target.value,
                                  )
                                }
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                              />
                            </label>

                            {selectedRecord.id ? (
                              <label className="block text-sm font-semibold">
                                Slug
                                <input
                                  value={selectedRecord.slug || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "slug",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                            ) : (
                              <p className="rounded bg-[#f7f8f9] px-3 py-2 text-xs font-semibold text-[#6a757d]">
                                Slug will be generated by the backend from the
                                title.
                              </p>
                            )}

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <label className="block text-sm font-semibold">
                                Category
                                <input
                                  value={selectedRecord.category || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "category",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                              <label className="block text-sm font-semibold">
                                SEO Title
                                <input
                                  value={selectedRecord.seo_title || ""}
                                  onChange={(event) =>
                                    updateSelectedField(
                                      "seo_title",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                                />
                              </label>
                            </div>

                            <label className="block text-sm font-semibold">
                              Summary
                              <textarea
                                value={selectedRecord.summary || ""}
                                onChange={(event) =>
                                  updateSelectedField(
                                    "summary",
                                    event.target.value,
                                  )
                                }
                                rows={3}
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                              />
                            </label>

                            <RichTextEditor
                              key={`${selectedRecord.id || selectedRecord.draftKey || "new-resource"}-body`}
                              label="Body"
                              value={selectedRecord.body || ""}
                              onChange={(value) =>
                                updateSelectedField("body", value)
                              }
                            />

                            <label className="block text-sm font-semibold">
                              Meta Description
                              <textarea
                                value={selectedRecord.meta_description || ""}
                                onChange={(event) =>
                                  updateSelectedField(
                                    "meta_description",
                                    event.target.value,
                                  )
                                }
                                rows={3}
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal"
                              />
                            </label>

                            <label className="block text-sm font-semibold">
                              Featured Image
                              {selectedRecord.featured_image && (
                                <img
                                  src={buildAssetUrl(
                                    selectedRecord.featured_image,
                                  )}
                                  alt=""
                                  className="mt-2 h-32 w-full rounded border border-[#d7dadd] object-cover"
                                />
                              )}
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                onChange={(event) =>
                                  updateSelectedField(
                                    "featuredImageFile",
                                    event.target.files?.[0] || null,
                                  )
                                }
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 text-sm font-normal"
                              />
                              {selectedRecord.featuredImageFile && (
                                <span className="mt-1 block text-xs font-semibold text-[#6a757d]">
                                  Selected:{" "}
                                  {selectedRecord.featuredImageFile.name}
                                </span>
                              )}
                              {!selectedRecord.id &&
                                !selectedRecord.featuredImageFile && (
                                  <span className="mt-1 block text-xs font-semibold text-[#c8102e]">
                                    Required for new resources.
                                  </span>
                                )}
                            </label>

                            <label className="block text-sm font-semibold">
                              Download / File
                              {selectedRecord.file?.fileUrl && (
                                <a
                                  href={buildAssetUrl(
                                    selectedRecord.file.fileUrl,
                                  )}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 block text-sm font-semibold text-[#4a8bc1] underline-offset-2 hover:underline"
                                >
                                  Current file
                                </a>
                              )}
                              <input
                                type="file"
                                onChange={(event) =>
                                  updateSelectedField(
                                    "resourceFile",
                                    event.target.files?.[0] || null,
                                  )
                                }
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 text-sm font-normal"
                              />
                              {selectedRecord.resourceFile && (
                                <span className="mt-1 block text-xs font-semibold text-[#6a757d]">
                                  Selected: {selectedRecord.resourceFile.name}
                                </span>
                              )}
                            </label>
                          </div>
                        )}

                        {selectedRecord.queue === "settings" && (
                          <AdminSettingsEditor
                            record={selectedRecord}
                            onChange={updateSelectedRecord}
                          />
                        )}

                        {selectedRecord.queue === "homeCms" && (
                          <HomeCmsEditor
                            record={selectedRecord}
                            onChange={updateSelectedRecord}
                          />
                        )}

                        {selectedRecord.queue === "aboutCms" && (
                          <AboutCmsEditor
                            record={selectedRecord}
                            onChange={updateSelectedRecord}
                          />
                        )}

                        {selectedRecord.queue === "advocateCms" && (
                          <AdvocateCmsEditor
                            record={selectedRecord}
                            onChange={updateSelectedRecord}
                          />
                        )}

                        {selectedRecord.queue === "contactCms" && (
                          <ContactCmsEditor
                            record={selectedRecord}
                            onChange={updateSelectedRecord}
                          />
                        )}

                        {selectedRecord.queue === "genericCms" && (
                          <GenericCmsEditor
                            record={selectedRecord}
                            onChange={updateSelectedRecord}
                            onLoadById={loadGenericCmsById}
                            isLoading={isSaving}
                          />
                        )}

                        {selectedRecord.queue === "notifications" && (
                          <NotificationsEditor
                            record={selectedRecord}
                            onDelete={deleteNotification}
                            isSaving={isSaving}
                          />
                        )}

                        {(selectedRecord.queue === "privacy" ||
                          selectedRecord.queue === "terms") && (
                          <div className="mt-5 space-y-4">
                            {selectedRecord.backendMissing && (
                              <div className="rounded border border-[#ead7a3] bg-[#fff8e5] px-4 py-3 text-sm font-semibold text-[#75520d]">
                                Backend returned no {selectedConfig.label}{" "}
                                record. Add a seeded legal document or a create
                                endpoint before this editor can save content.
                              </div>
                            )}
                            <RichTextEditor
                              key={`${selectedRecord.queue}-${selectedRecord.id || "singleton"}-body`}
                              label={`${selectedConfig.label} Content`}
                              value={selectedRecord.body || ""}
                              onChange={(value) =>
                                updateSelectedField("body", value)
                              }
                            />
                          </div>
                        )}

                        {!nonWorkflowQueues.includes(selectedRecord.queue) &&
                          selectedRecord.queue !== "removalRequests" && (
                          <>
                            <label className="mt-5 block text-sm font-semibold">
                              Workflow Status
                            </label>
                            {selectedRecord.queue === "stories" &&
                            selectedRecord.status === "removed" ? (
                              <div className="mt-2 flex w-full items-center rounded border border-red-300 bg-red-50 px-4 py-3">
                                <span className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-bold text-white">
                                  Removed
                                </span>
                              </div>
                            ) : (
                              <select
                                value={
                                  selectedRecord?.status ||
                                  selectedRecord?.publish_status ||
                                  "new"
                                }
                                onChange={(event) =>
                                  updateSelectedField(
                                    "status",
                                    event.target.value,
                                  )
                                }
                                className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2"
                              >
                                {selectedConfig.statuses
                                  .filter((status) => status !== "removed")
                                  .map((status) => (
                                    <option key={status} value={status}>
                                      {formatStatus(status)}
                                    </option>
                                  ))}
                              </select>
                            )}
                          </>
                        )}

                        {/* Story uploads section */}
                        {selectedRecord.queue === "stories" && (
                          <div className="mt-5 border-t border-[#e5e5e5] pt-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold">
                                Story Uploads
                              </p>
                              <span className="rounded-full bg-[#eaf1f6] px-2.5 py-1 text-xs font-bold text-[#405b6d]">
                                {existingStoryUploadCount} / {MAX_STORY_UPLOADS}
                              </span>
                            </div>
                            {/* existing uploads */}
                            {(selectedRecord.story_uploads || []).length >
                              0 && (
                              <div className="mb-3 max-h-72 space-y-1 overflow-y-auto rounded border border-[#e5e5e5] bg-[#f8fafb] p-2 pr-1">
                                {(selectedRecord.story_uploads || []).map(
                                  (upload, index) => {
                                    const fileUrl = getStoryUploadUrl(upload);
                                    return (
                                      <div
                                        key={
                                          fileUrl ||
                                          `${getStoryUploadLabel(upload)}-${index}`
                                        }
                                        className="flex items-center justify-between rounded border border-[#e5e5e5] bg-white px-3 py-2 text-xs"
                                      >
                                        <div className="flex min-w-0 items-center gap-2">
                                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eaf1f6] text-[10px] font-bold text-[#405b6d]">
                                            {index + 1}
                                          </span>
                                          <a
                                            href={
                                              fileUrl
                                                ? buildAssetUrl(fileUrl)
                                                : undefined
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            title={getStoryUploadLabel(upload)}
                                            className="truncate text-[#405b6d] underline-offset-2 hover:underline"
                                          >
                                            {getStoryUploadLabel(upload)}
                                          </a>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setStoryUploadToRemove({
                                              fileUrl,
                                              label:
                                                getStoryUploadLabel(upload),
                                            })
                                          }
                                          disabled={
                                            !fileUrl || isUploadingFiles
                                          }
                                          className="ml-2 shrink-0 font-semibold text-red-500 hover:text-red-700 disabled:opacity-50"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            )}
                            {(selectedRecord.story_uploads || []).length ===
                              0 && (
                              <p className="text-xs text-[#8b949b] mb-2">
                                No uploads attached.
                              </p>
                            )}
                            {/* add uploads */}
                            <label
                              htmlFor="admin-story-uploads"
                              className="mb-1 block text-xs font-semibold text-[#6a757d]"
                            >
                              {remainingStoryUploadSlots > 0
                                ? `Add files (${remainingStoryUploadSlots} remaining)`
                                : `Upload limit reached (${MAX_STORY_UPLOADS} total)`}
                            </label>
                            <input
                              id="admin-story-uploads"
                              type="file"
                              multiple
                              accept="image/*,application/pdf,.doc,.docx,video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/webm"
                              ref={uploadFileInputRef}
                              onChange={(e) => addStoryUploads(e.target.files)}
                              disabled={
                                isUploadingFiles ||
                                remainingStoryUploadSlots === 0
                              }
                              className="w-full text-xs border border-[#cfd3d7] rounded px-2 py-1.5 disabled:opacity-60"
                            />
                            <p className="mt-1 text-xs text-[#7a858d]">
                              Maximum {MAX_STORY_UPLOADS} files per story. Existing
                              files count toward this limit.
                            </p>
                            {isUploadingFiles && (
                              <p className="text-xs text-[#4a8bc1] mt-1">
                                Uploading...
                              </p>
                            )}
                          </div>
                        )}

                        {selectedRecord.id &&
                          (["blogs", "pages", "resources"].includes(
                            selectedRecord.queue,
                          ) ||
                            (isFrontendManagedQueue(selectedRecord.queue) &&
                              selectedRecord.localOnly)) && (
                            <button
                              type="button"
                              onClick={deleteSelectedContent}
                              disabled={isSaving}
                              className="mt-5 flex w-full items-center justify-center gap-2 rounded border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 disabled:opacity-60"
                            >
                              <FiTrash2 />
                              {selectedRecord.queue === "resources"
                                ? "Archive Resource"
                                : isFrontendManagedQueue(selectedRecord.queue)
                                  ? "Remove Local Item"
                                  : `Delete ${selectedRecord.queue === "blogs" ? "Blog" : "Page"}`}
                            </button>
                          )}

                        {![
                          "notifications",
                          "removalRequests",
                        ].includes(selectedRecord.queue) && (
                          <button
                            onClick={saveSelectedRecord}
                            disabled={
                              isSaving ||
                              ([
                                "privacy",
                                "terms",
                                ...singletonQueueKeys,
                              ].includes(selectedRecord.queue) &&
                                selectedRecord.queue !== "genericCms" &&
                                !selectedRecord.id)
                            }
                            className="mt-5 w-full rounded bg-[#4a8bc1] px-5 py-3 text-lg font-semibold text-white disabled:opacity-60"
                          >
                            {isSaving ? "Saving..." : "Save Record"}
                          </button>
                        )}
                      </div>
                    )}
                  </aside>
                </div>
              )}

              {storyUploadToRemove && (
                <div
                  className="fixed inset-0 z-[120] flex items-center justify-center bg-[#081827]/70 p-4 backdrop-blur-[2px]"
                  role="presentation"
                  onMouseDown={(event) => {
                    if (
                      event.target === event.currentTarget &&
                      !isUploadingFiles
                    ) {
                      setStoryUploadToRemove(null);
                    }
                  }}
                >
                  <div
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="remove-story-upload-title"
                    aria-describedby="remove-story-upload-description"
                    className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl sm:p-8"
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
                      <FiTrash2 size={30} aria-hidden="true" />
                    </div>
                    <h3
                      id="remove-story-upload-title"
                      className="mt-5 text-2xl font-bold text-[#243746]"
                    >
                      Remove this file?
                    </h3>
                    <p
                      id="remove-story-upload-description"
                      className="mt-2 text-sm leading-6 text-[#667784]"
                    >
                      <span className="block truncate font-semibold text-[#405b6d]">
                        {storyUploadToRemove.label}
                      </span>
                      This action permanently removes the file from this story.
                    </p>
                    <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                      <button
                        type="button"
                        onClick={() => setStoryUploadToRemove(null)}
                        disabled={isUploadingFiles}
                        className="rounded-lg border border-[#cfd8de] px-6 py-2.5 font-bold text-[#405b6d] hover:bg-[#f4f7f8] disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={removeStoryUpload}
                        disabled={isUploadingFiles}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#d92d20] px-6 py-2.5 font-bold text-white hover:bg-[#b42318] disabled:opacity-60"
                      >
                        {isUploadingFiles ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            Removing...
                          </>
                        ) : (
                          "Yes, remove it"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminDashboard;
