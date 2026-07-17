import { buildAssetUrl } from "./api";
import {
  CMS_BUTTON_STYLE_OPTIONS,
  normalizeCmsButtonStyle,
} from "./cmsButtonStyles";

export { CMS_BUTTON_STYLE_OPTIONS };

export const singletonQueueKeys = [
  "settings",
  "homeCms",
  "aboutCms",
  "advocateCms",
  "contactCms",
  "genericCms",
];

export const cmsQueueKeys = [
  "homeCms",
  "aboutCms",
  "advocateCms",
  "contactCms",
  "genericCms",
];

export const nonWorkflowQueues = [
  "settings",
  "homeCms",
  "aboutCms",
  "advocateCms",
  "contactCms",
  "genericCms",
  "notifications",
  "privacy",
  "terms",
];

const emptySettings = {
  logo: { url: "", altText: "" },
  contactInfo: { email: "", phone: "", address: "" },
  socialLinks: [],
  footer: { text: "", links: [] },
  disclaimer: "",
  attorneyDisclaimer: "",
  navigationLabels: [],
  defaultSEO: {
    metaTitle: "",
    metaDescription: "",
    metaKeywords: [],
  },
};

function unwrapResponse(response) {
  return response?.data || response?.record || response || {};
}

function makeDate(value) {
  return value || new Date().toISOString();
}

function normalizeKeywords(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeFooterLinks(value) {
  return (Array.isArray(value) ? value : []).map((link) => ({
    label: link?.label || "",
    url: link?.url || "",
  }));
}

function normalizeNavigationLinks(value) {
  return (Array.isArray(value) ? value : []).map((link) => ({
    label: link?.label || "",
    url: link?.url || "",
    dropdown: Array.isArray(link?.dropdown)
      ? link.dropdown.map((item) => ({
          label: item?.label || "",
          url: item?.url || "",
        }))
      : [],
  }));
}

function normalizeButtons(value) {
  return (Array.isArray(value) ? value : []).map((button) => ({
    text: button?.text || "",
    link: button?.link || "",
    style: normalizeCmsButtonStyle(button?.style),
  }));
}

function normalizeCards(value) {
  return (Array.isArray(value) ? value : []).map((card) => ({
    title: card?.title || "",
    description: card?.description || "",
  }));
}

function normalizeFormFields(value) {
  return (Array.isArray(value) ? value : []).map((field) => ({
    label: field?.label || "",
    placeholder: field?.placeholder || "",
  }));
}

function normalizeGenericSections(value) {
  return (Array.isArray(value) ? value : []).map((section) => ({
    sectionKey: section?.sectionKey || "",
    titleMain: section?.titleMain || "",
    titleSubtitle: section?.titleSubtitle || "",
    content:
      typeof section?.content === "string"
        ? section.content
        : JSON.stringify(section?.content ?? "", null, 2),
    disclaimerText: section?.disclaimerText || "",
    checkboxText: section?.checkboxText || "",
  }));
}

function normalizeGenericFormDefinition(value) {
  return (Array.isArray(value) ? value : []).map((field) => ({
    key: field?.key || "",
    label: field?.label || "",
    type: field?.type || "text",
    placeholder: field?.placeholder || "",
    description: field?.description || "",
    optionsInput: Array.isArray(field?.options) ? field.options.join(", ") : "",
    required: Boolean(field?.required),
  }));
}

export function normalizeSettingsRecord(response) {
  const record = unwrapResponse(response);

  return {
    ...emptySettings,
    ...record,
    id: record.id || record._id,
    singletonKey: "settings",
    queue: "settings",
    title: "Site Settings",
    status: "published",
    created_at: makeDate(record.created_at || record.createdAt || record.updatedAt),
    logo: {
      ...emptySettings.logo,
      ...(record.logo || {}),
    },
    contactInfo: {
      ...emptySettings.contactInfo,
      ...(record.contactInfo || {}),
    },
    socialLinks: (Array.isArray(record.socialLinks) ? record.socialLinks : []).map(
      (link) => ({
        platform: link?.platform || "",
        url: link?.url || "",
      }),
    ),
    footer: {
      ...emptySettings.footer,
      ...(record.footer || {}),
      links: normalizeFooterLinks(record.footer?.links),
    },
    navigationLabels: normalizeNavigationLinks(record.navigationLabels),
    defaultSEO: {
      ...emptySettings.defaultSEO,
      ...(record.defaultSEO || {}),
      metaKeywords: normalizeKeywords(record.defaultSEO?.metaKeywords),
      metaKeywordsInput: normalizeKeywords(record.defaultSEO?.metaKeywords).join(", "),
    },
  };
}

export function normalizeCmsRecord(response, queue) {
  const record = unwrapResponse(response);
  const id = record.id || record._id;
  const base = {
    ...record,
    id,
    singletonKey: queue,
    queue,
    status: "published",
    created_at: makeDate(record.created_at || record.createdAt || record.updatedAt),
  };

  if (queue === "homeCms") {
    return {
      ...base,
      title: "Home Page CMS",
      pageKey: record.pageKey || "home",
      hero: {
        featured_image1: record.hero?.featured_image1 || {},
        subtitle: record.hero?.subtitle || "",
        buttons: normalizeButtons(record.hero?.buttons),
        disclaimerCheckboxText: record.hero?.disclaimerCheckboxText || "",
        introText: record.hero?.introText || "",
      },
      highlight: {
        heading: record.highlight?.heading || "",
        subHeading: record.highlight?.subHeading || "",
      },
      propertyComparison: {
        featured_image2: record.propertyComparison?.featured_image2 || {},
        disclaimer: record.propertyComparison?.disclaimer || "",
        mainText: record.propertyComparison?.mainText || "",
        highlightText: record.propertyComparison?.highlightText || "",
      },
    };
  }

  if (queue === "aboutCms") {
    return {
      ...base,
      title: "About Page CMS",
      pageKey: record.pageKey || "about",
      content: record.content || record.lowerContent || "",
    };
  }

  if (queue === "advocateCms") {
    return {
      ...base,
      title: "Non-Legal Advocate CMS",
      pageKey: record.pageKey || "non-legal-advocate",
      featured_image1: record.featured_image1 || {},
      background_image: record.background_image || {},
      heroHeading: record.heroHeading || "",
      subtitle: record.subtitle || "",
      description: record.description || "",
      buttons: normalizeButtons(record.buttons),
      cards: normalizeCards(record.cards),
    };
  }

  if (queue === "contactCms") {
    return {
      ...base,
      title: "Contact Page CMS",
      pageKey: record.pageKey || "contact",
      heading: record.heading || "",
      subHeading: record.subHeading || "",
      description: record.description || "",
      formFields: normalizeFormFields(record.formFields),
      privacyText: record.privacyText || "",
    };
  }

  return {
    ...base,
    title: record.pageKey ? `Generic CMS: ${record.pageKey}` : "Generic CMS by ID",
    pageKey: record.pageKey || "",
    cmsLookupId: id || "",
    sections: normalizeGenericSections(record.sections),
    formDefinition: normalizeGenericFormDefinition(record.formDefinition),
    featured_image_left: record.featured_image_left || "",
    featured_image_right: record.featured_image_right || "",
  };
}

export function normalizeNotificationRecord(record = {}) {
  const id = record.id || record._id;
  return {
    ...record,
    id,
    queue: "notifications",
    title: record.title || "Admin notification",
    description: record.description || "",
    type: record.type || "info",
    isRead: Boolean(record.isRead),
    relatedModule: record.relatedModule || "",
    relatedId: record.relatedId || null,
    status: record.isRead ? "read" : "unread",
    created_at: makeDate(record.created_at || record.createdAt || record.updatedAt),
  };
}

export function getLogoPreview(record) {
  if (record?.logoImageFile) {
    return URL.createObjectURL(record.logoImageFile);
  }
  return buildAssetUrl(record?.logo?.url || "");
}

function appendJson(formData, key, value) {
  formData.append(key, JSON.stringify(value));
}

function requireText(value, label) {
  if (!String(value || "").trim()) {
    throw new Error(`${label} is required.`);
  }
  return String(value).trim();
}

function cleanSimpleLinks(links, label) {
  return (Array.isArray(links) ? links : [])
    .map((link) => ({
      label: String(link?.label || "").trim(),
      url: String(link?.url || "").trim(),
    }))
    .filter((link) => {
      if (!link.label && !link.url) return false;
      if (!link.label || !link.url) {
        throw new Error(`${label} links need both label and URL.`);
      }
      return true;
    });
}

function cleanLinks(links, label) {
  return (Array.isArray(links) ? links : [])
    .map((link) => ({
      label: String(link?.label || "").trim(),
      url: String(link?.url || "").trim(),
      dropdown: cleanDropdown(link?.dropdown),
    }))
    .filter((link) => {
      if (!link.label && !link.url && link.dropdown.length === 0) return false;
      if (!link.label || !link.url) {
        throw new Error(`${label} links need both label and URL.`);
      }
      return true;
    });
}

function cleanDropdown(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      label: String(item?.label || "").trim(),
      url: String(item?.url || "").trim(),
    }))
    .filter((item) => {
      if (!item.label && !item.url) return false;
      if (!item.label || !item.url) {
        throw new Error("Dropdown links need both label and URL.");
      }
      return true;
    });
}

function cleanButtons(buttons, { min = 0 } = {}) {
  const cleaned = (Array.isArray(buttons) ? buttons : [])
    .map((button) => ({
      text: String(button?.text || "").trim(),
      link: String(button?.link || "").trim(),
      style: normalizeCmsButtonStyle(button?.style),
    }))
    .filter((button) => {
      if (!button.text && !button.link) return false;
      if (!button.text || !button.link) {
        throw new Error("Buttons need both text and link.");
      }
      return true;
    });

  if (cleaned.length < min) {
    throw new Error("At least one button is required.");
  }
  return cleaned;
}

function cleanSocialLinks(links) {
  return (Array.isArray(links) ? links : [])
    .map((link) => ({
      platform: String(link?.platform || "").trim(),
      url: String(link?.url || "").trim(),
    }))
    .filter((link) => {
      if (!link.platform && !link.url) return false;
      if (!link.platform || !link.url) {
        throw new Error("Social links need both platform and URL.");
      }
      return true;
    });
}

function cleanCards(cards) {
  return (Array.isArray(cards) ? cards : [])
    .map((card) => ({
      title: String(card?.title || "").trim(),
      description: String(card?.description || "").trim(),
    }))
    .filter((card) => {
      if (!card.title && !card.description) return false;
      if (!card.title || !card.description) {
        throw new Error("Cards need both title and description.");
      }
      return true;
    });
}

export function buildSettingsFormData(record) {
  const formData = new FormData();
  appendJson(formData, "logo", {
    altText: record.logo?.altText || "HomeOwnersAssociation",
  });
  appendJson(formData, "contactInfo", {
    email: record.contactInfo?.email || "",
    phone: record.contactInfo?.phone || "",
    address: record.contactInfo?.address || "",
  });
  appendJson(formData, "socialLinks", cleanSocialLinks(record.socialLinks));
  appendJson(formData, "footer", {
    text: record.footer?.text || "",
    links: cleanSimpleLinks(record.footer?.links, "Footer"),
  });
  appendJson(formData, "navigationLabels", cleanLinks(record.navigationLabels, "Navigation"));
  appendJson(formData, "defaultSEO", {
    metaTitle: record.defaultSEO?.metaTitle || "",
    metaDescription: record.defaultSEO?.metaDescription || "",
    metaKeywords: normalizeKeywords(
      record.defaultSEO?.metaKeywordsInput ?? record.defaultSEO?.metaKeywords,
    ),
  });
  formData.append("disclaimer", record.disclaimer || "");
  formData.append("attorneyDisclaimer", record.attorneyDisclaimer || "");

  if (record.logoImageFile) {
    formData.append("logo_image", record.logoImageFile);
  }

  return formData;
}

export function buildHomeCmsFormData(record) {
  const formData = new FormData();
  formData.append("pageKey", "home");
  appendJson(formData, "hero", {
    subtitle: requireText(record.hero?.subtitle, "Hero subtitle"),
    buttons: cleanButtons(record.hero?.buttons, { min: 1 }),
    disclaimerCheckboxText: requireText(
      record.hero?.disclaimerCheckboxText,
      "Disclaimer checkbox text",
    ),
    introText: requireText(record.hero?.introText, "Hero intro text"),
  });
  appendJson(formData, "highlight", {
    heading: requireText(record.highlight?.heading, "Highlight heading"),
    subHeading: requireText(record.highlight?.subHeading, "Highlight subheading"),
  });
  appendJson(formData, "propertyComparison", {
    disclaimer: requireText(
      record.propertyComparison?.disclaimer,
      "Property comparison disclaimer",
    ),
    mainText: requireText(record.propertyComparison?.mainText, "Property comparison main text"),
    highlightText: requireText(
      record.propertyComparison?.highlightText,
      "Property comparison highlight text",
    ),
  });
  formData.append(
    "featured_image1_alt",
    record.hero?.featured_image1?.altText || "",
  );
  formData.append(
    "featured_image2_alt",
    record.propertyComparison?.featured_image2?.altText || "",
  );

  if (record.featuredImage1File) formData.append("featured_image1", record.featuredImage1File);
  if (record.featuredImage2File) formData.append("featured_image2", record.featuredImage2File);

  return formData;
}

export function buildAboutCmsPayload(record) {
  return {
    pageKey: "about",
    content: requireText(record.content, "About page content"),
  };
}

export function buildAdvocateCmsFormData(record) {
  const formData = new FormData();
  formData.append("pageKey", "non-legal-advocate");
  formData.append("featured_image_alt", record.featured_image1?.altText || "");
  formData.append("background_image_alt", record.background_image?.altText || "");
  formData.append("heroHeading", requireText(record.heroHeading, "Hero heading"));
  formData.append("subtitle", requireText(record.subtitle, "Subtitle"));
  formData.append("description", requireText(record.description, "Description"));
  appendJson(formData, "buttons", cleanButtons(record.buttons));
  appendJson(formData, "cards", cleanCards(record.cards));

  if (record.featuredImageFile) formData.append("featured_image", record.featuredImageFile);
  if (record.backgroundImageFile) formData.append("background_image", record.backgroundImageFile);

  return formData;
}

export function buildContactCmsPayload(record) {
  const formFields = normalizeFormFields(record.formFields).filter((field) => {
    if (!field.label && !field.placeholder) return false;
    if (!field.label) throw new Error("Contact form field label is required.");
    return true;
  });

  if (formFields.length === 0) {
    throw new Error("At least one contact form field is required.");
  }

  return {
    pageKey: "contact",
    heading: requireText(record.heading, "Contact page heading"),
    subHeading: record.subHeading || "",
    description: requireText(record.description, "Contact page description"),
    formFields: formFields.slice(0, 4),
    privacyText: record.privacyText || "",
  };
}

function parseJsonMaybe(value, label) {
  const text = String(value || "").trim();
  if (!text) return "";
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} content must be valid JSON.`);
  }
}

export function buildGenericCmsFormData(record) {
  const formData = new FormData();
  formData.append("pageKey", requireText(record.pageKey, "Page key"));
  appendJson(
    formData,
    "sections",
    (Array.isArray(record.sections) ? record.sections : [])
      .map((section) => ({
        sectionKey: String(section?.sectionKey || "").trim(),
        titleMain: section?.titleMain || "",
        titleSubtitle: section?.titleSubtitle || "",
        content: parseJsonMaybe(section?.content, section?.sectionKey || "Section"),
        disclaimerText: section?.disclaimerText || "",
        checkboxText: section?.checkboxText || "",
      }))
      .filter((section) => {
        if (!section.sectionKey && !section.titleMain && !section.titleSubtitle) {
          return false;
        }
        if (!section.sectionKey) {
          throw new Error("Each generic CMS section needs a section key.");
        }
        return true;
      }),
  );
  appendJson(
    formData,
    "formDefinition",
    (Array.isArray(record.formDefinition) ? record.formDefinition : [])
      .map((field) => ({
        key: String(field?.key || "").trim(),
        label: String(field?.label || "").trim(),
        type: field?.type || "text",
        placeholder: field?.placeholder || "",
        description: field?.description || "",
        options:
          field?.type === "select"
            ? normalizeKeywords(field?.optionsInput || field?.options)
            : undefined,
        required: Boolean(field?.required),
      }))
      .filter((field) => {
        if (!field.key && !field.label) return false;
        if (!field.key || !field.label) {
          throw new Error("Generic CMS form fields need both key and label.");
        }
        if (field.type === "select" && (!field.options || field.options.length === 0)) {
          throw new Error("Select form fields need options.");
        }
        return true;
      }),
  );

  if (record.featuredImage1File) formData.append("featured_image1", record.featuredImage1File);
  if (record.featuredImage2File) formData.append("featured_image2", record.featuredImage2File);

  return formData;
}

