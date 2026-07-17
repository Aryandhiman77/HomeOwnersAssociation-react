export function slugifyText(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

export function getAttorneyPublicSlug(attorney) {
  const parts = [
    attorney?.attorney_name,
    attorney?.attorney_firm,
    attorney?.attorney_city,
    attorney?.attorney_state,
    attorney?.attorney_county,
  ].filter(Boolean);

  return attorney?.slug || slugifyText(parts.join(" ")) || "attorney-profile";
}
