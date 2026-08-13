// const PRODUCTION_BACKEND = "https://hoa-backend-adic.onrender.com";
const PRODUCTION_BACKEND = "https://hoanightmares.org";
const ADMIN_SESSION_KEY = "hoa_nightmares_admin_session";
const ADMIN_TOKEN_KEY = "hoa_nightmares_admin_token";
const ADMIN_USER_KEY = "hoa_nightmares_admin_user";
const ADMIN_AUTH_EXPIRED_EVENT = "hoa-admin-auth-expired";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "" : PRODUCTION_BACKEND)
).replace(/\/$/, "");

export const ASSET_BASE_URL = (
  import.meta.env.VITE_ASSET_BASE_URL ||
  API_BASE_URL ||
  (import.meta.env.DEV ? "" : PRODUCTION_BACKEND)
).replace(/\/$/, "");

function getStoredAdminToken() {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(ADMIN_TOKEN_KEY) || "";
}

function withAuthHeaders(path, headers = {}) {
  if (!isAdminRequestPath(path)) return headers;

  const token = getStoredAdminToken();
  if (!token || headers.Authorization) return headers;
  return { ...headers, Authorization: `Bearer ${token}` };
}

function isAdminRequestPath(path) {
  const rawPath = String(path || "");

  try {
    const url = new URL(rawPath);
    return url.pathname.startsWith("/api/admin") || url.pathname.startsWith("/admin");
  } catch {
    const normalizedPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
    return normalizedPath.startsWith("/api/admin") || normalizedPath.startsWith("/admin");
  }
}

function clearStoredAdminAuth() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
}

function notifyAdminAuthExpired() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ADMIN_AUTH_EXPIRED_EVENT));
}

function shouldAutoLogoutAdmin(path, status, message) {
  if (!isAdminRequestPath(path)) return false;
  if (status === 401 || status === 403) return true;
  return /no authorization token provided|unauthorized|unauthenticated|invalid token|token expired/i.test(
    String(message || ""),
  );
}

function handleAdminAuthFailure(path, status, message) {
  if (!shouldAutoLogoutAdmin(path, status, message)) return false;
  clearStoredAdminAuth();
  notifyAdminAuthExpired();
  return true;
}

function buildApiUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    const url = new URL(path);

    if (url.pathname.startsWith("/admin/")) {
      url.pathname = `/api${url.pathname}`;
    }

    return url.toString();
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (normalizedPath.startsWith("/api/")) {
    return `${API_BASE_URL}${normalizedPath}`;
  }

  if (normalizedPath.startsWith("/admin/")) {
    return `${API_BASE_URL}/api${normalizedPath}`;
  }

  return `${API_BASE_URL}/api/public${normalizedPath}`;
}

async function requestJson(path, options = {}) {
  const { headers, ...requestOptions } = options;
  const response = await fetchWithFriendlyNetworkError(
    buildApiUrl(path),
    {
      headers: withAuthHeaders(path, {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(headers || {}),
      }),
      credentials: "include",
      cache: "no-store",
      ...requestOptions,
    },
    path,
  );

  const text = await response.text();
  const data = text ? parseJsonOrThrow(text, path) : {};

  if (!response.ok) {
    const message =
      data.message ||
      data.error ||
      (Array.isArray(data.errors)
        ? data.errors[0]?.message || data.errors[0]?.msg
        : null) ||
      "Something went wrong. Please try again.";

    if (handleAdminAuthFailure(path, response.status, message)) {
      throw new Error("Admin session expired. Please log in again.");
    }

    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

async function requestFormData(path, formData, options = {}) {
  const { headers, ...requestOptions } = options;
  const response = await fetchWithFriendlyNetworkError(
    buildApiUrl(path),
    {
      method: "POST",
      body: formData,
      headers: withAuthHeaders(path, {
        Accept: "application/json",
        ...(headers || {}),
      }),
      credentials: "include",
      ...requestOptions,
    },
    path,
  );

  const text = await response.text();
  const data = text ? parseJsonOrThrow(text, path) : {};

  if (!response.ok) {
    const message =
      data.message ||
      data.error ||
      (Array.isArray(data.errors)
        ? data.errors[0]?.message || data.errors[0]?.msg
        : null) ||
      "Something went wrong. Please try again.";

    if (handleAdminAuthFailure(path, response.status, message)) {
      throw new Error("Admin session expired. Please log in again.");
    }

    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function parseJsonOrThrow(text, path) {
  try {
    return JSON.parse(text);
  } catch {
    const preview = text.replace(/\s+/g, " ").slice(0, 120);
    throw new Error(
      `Expected JSON while calling ${path}, but received: ${preview}`,
    );
  }
}

async function fetchWithFriendlyNetworkError(url, options, path) {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Network/CORS error while calling ${path}. The live backend did not complete the browser request. Check backend CORS OPTIONS handling and route timeout logs.`,
      );
    }

    throw error;
  }
}

export function getJson(path, options = {}) {
  return requestJson(path, { method: "GET", ...options });
}

export function postJson(path, payload) {
  return requestJson(path, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function putJson(path, payload) {
  return requestJson(path, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function patchJson(path, payload) {
  return requestJson(path, {
    method: "PATCH",
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

export function postFormData(path, formData) {
  return requestFormData(path, formData);
}

export function putFormData(path, formData) {
  return requestFormData(path, formData, { method: "PUT" });
}

export function patchFormData(path, formData) {
  return requestFormData(path, formData, { method: "PATCH" });
}

export function deleteJson(path, payload) {
  return requestJson(path, {
    method: "DELETE",
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

export function buildAssetUrl(path) {
  if (!path) {
    return "";
  }

  if (/^(blob:|data:)/i.test(path)) {
    return path;
  }

  if (/^https?:\/\//i.test(path)) {
    try {
      const assetUrl = new URL(path);
      if (import.meta.env.DEV && assetUrl.pathname.startsWith("/uploads/")) {
        return `${assetUrl.pathname}${assetUrl.search}${assetUrl.hash}`;
      }
    } catch {
      return path;
    }

    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${ASSET_BASE_URL}${normalizedPath}`;
}
