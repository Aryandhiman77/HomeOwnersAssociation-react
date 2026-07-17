export function slugifyText(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

export function getStoryTitle(story) {
  return story?.story_summary || story?.story_hoa_name || "HOA Horror Story";
}

export function getStoryPublicSlug(story) {
  const explicitSlug = story?.story_slug || story?.slug;
  if (explicitSlug) return slugifyText(explicitSlug);
  const issue = Array.isArray(story?.story_issue_type)
    ? story.story_issue_type[0]
    : story?.story_issue_type;
  const parts = [
    story?.story_hoa_name,
    story?.story_city,
    story?.story_state,
    issue,
    story?.story_summary,
  ].filter(Boolean);

  return slugifyText(parts.join(" ")) || "hoa-horror-story";
}
