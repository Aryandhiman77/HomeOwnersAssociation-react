import { getJson, postJson } from "./api";

const ADMIN_SESSION_KEY = "hoa_nightmares_admin_session";
const ADMIN_TOKEN_KEY = "hoa_nightmares_admin_token";
const ADMIN_USER_KEY = "hoa_nightmares_admin_user";

const ADMIN_API_URL = "/api/admin";
const ADMIN_LOGIN_ENDPOINT = `${ADMIN_API_URL}/login`;
const ADMIN_VERIFY_OTP_ENDPOINT = `${ADMIN_API_URL}/verify-otp`;
const ADMIN_LOGOUT_ENDPOINT = `${ADMIN_API_URL}/logout`;
const ADMIN_AUTH_MODE = import.meta.env.VITE_ADMIN_AUTH_MODE || "auto";

function storageSet(key, value) {
  localStorage.setItem(key, value);
}

function storageRemove(key) {
  localStorage.removeItem(key);
}

function unwrapPayload(response) {
  return response?.data && typeof response.data === "object"
    ? response.data
    : response || {};
}

function getMessage(response, fallback) {
  return response?.message || response?.data?.message || fallback;
}

function extractToken(payload) {
  return (
    payload?.token ||
    payload?.accessToken ||
    payload?.authToken ||
    payload?.jwt ||
    payload?.adminToken ||
    ""
  );
}

function completeAdminSession(payload = {}) {
  const token = extractToken(payload);
  const user = payload.user || payload.admin || payload.account || null;

  storageSet(ADMIN_SESSION_KEY, "true");
  if (token) storageSet(ADMIN_TOKEN_KEY, token);
  if (user) storageSet(ADMIN_USER_KEY, JSON.stringify(user));
}

function shouldTreatAsOtp(response, payload) {
  if (ADMIN_AUTH_MODE === "otp") return true;
  if (ADMIN_AUTH_MODE === "direct") return false;

  const message = getMessage(response, "");
  return (
    /otp|one[-\s]?time|verification code/i.test(message) &&
    !extractToken(payload)
  );
}

function isAuthenticatedResponse(response, payload) {
  if (extractToken(payload)) return true;
  if (payload.authenticated || payload.isAuthenticated) return true;
  if (payload.user || payload.admin || payload.account) return true;
  if (ADMIN_AUTH_MODE === "direct" && response?.success) return true;

  const message = getMessage(response, "");
  return Boolean(
    response?.success &&
    message &&
    !/otp|one[-\s]?time|verification code/i.test(message),
  );
}

export function isAdminLoggedIn() {
  return (
    localStorage.getItem(ADMIN_SESSION_KEY) === "true" ||
    Boolean(localStorage.getItem(ADMIN_TOKEN_KEY))
  );
}

export async function loginAdmin(email, password) {
  const response = await postJson(ADMIN_LOGIN_ENDPOINT, { email, password });
  const payload = unwrapPayload(response);

  if (isAuthenticatedResponse(response, payload)) {
    completeAdminSession(payload);
    return {
      authenticated: true,
      message: getMessage(response, "Signed in successfully."),
    };
  }

  if (shouldTreatAsOtp(response, payload)) {
    return {
      otpRequired: true,
      message: getMessage(response, "OTP sent to your email."),
    };
  }

  return {
    otpRequired: true,
    message: getMessage(
      response,
      "Verification required. Enter the OTP sent to your email.",
    ),
  };
}

export async function verifyAdminOtp(email, otp) {
  const response = await postJson(ADMIN_VERIFY_OTP_ENDPOINT, { email, otp });
  const payload = unwrapPayload(response);
  completeAdminSession(payload);

  return {
    authenticated: true,
    message: getMessage(response, "OTP verified."),
  };
}

export function logoutAdmin() {
  storageRemove(ADMIN_SESSION_KEY);
  storageRemove(ADMIN_TOKEN_KEY);
  storageRemove(ADMIN_USER_KEY);
}

export async function logoutAdminRemote() {
  try {
    await getJson(ADMIN_LOGOUT_ENDPOINT);
  } finally {
    logoutAdmin();
  }
}
