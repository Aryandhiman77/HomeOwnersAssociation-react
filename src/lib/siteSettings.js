import { buildAssetUrl, getJson } from "./api";

let cachedSettings = null;

export async function getSiteSettings(options = {}) {
  if (cachedSettings && !options.signal) {
    return cachedSettings;
  }

  const response = await getJson("/settings", options);
  const record = response?.data || response || {};
  const normalized = normalizeSiteSettings(record);

  if (!options.signal) {
    cachedSettings = normalized;
  }

  return normalized;
}

export function normalizeSiteSettings(record = {}) {
  const logoUrl = record.logo?.url ? buildAssetUrl(record.logo.url) : "";

  return {
    ...record,
    logoUrl,
    contactInfo: record.contactInfo || {},
    socialLinks: Array.isArray(record.socialLinks) ? record.socialLinks : [],
    attorneyDisclaimer: record.attorneyDisclaimer || "",
    navigationLabels: Array.isArray(record.navigationLabels)
      ? record.navigationLabels
      : [],
    footer: {
      ...(record.footer || {}),
      links: Array.isArray(record.footer?.links) ? record.footer.links : [],
    },
  };
}

export function getConfiguredUrl(items, platform, fallback) {
  const match = (items || []).find((item) =>
    String(item.platform || "").toLowerCase().includes(platform),
  );

  return match?.url || fallback;
}