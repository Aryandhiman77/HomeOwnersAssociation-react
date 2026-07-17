export const CMS_BUTTON_STYLE_OPTIONS = [
  { value: "red-text-white", label: "Red Solid" },
  { value: "red-bordered", label: "Red Border" },
  { value: "green-text-white", label: "Green Solid" },
  { value: "green-bordered", label: "Green Border" },
];

const CMS_BUTTON_STYLE_VALUES = new Set(
  CMS_BUTTON_STYLE_OPTIONS.map((option) => option.value),
);

const CMS_BUTTON_STYLE_CLASSES = {
  "red-text-white":
    "border-2 border-red-700 bg-red-700 text-white hover:border-red-800 hover:bg-red-800",
  "red-bordered":
    "border-2 border-red-700 bg-transparent text-red-700 hover:bg-red-700 hover:text-white",
  "green-text-white":
    "border-2 border-green-800 bg-green-800 text-white hover:border-[#0c3f00] hover:bg-[#0c3f00]",
  "green-bordered":
    "border-2 border-green-800 bg-transparent text-green-800 hover:bg-green-800 text-white lg:text-black",
};

export function normalizeCmsButtonStyle(style, fallback = "red-text-white") {
  if (CMS_BUTTON_STYLE_VALUES.has(style)) return style;
  if (style === "outline") {
    return fallback.endsWith("text-white")
      ? fallback.replace("text-white", "bordered")
      : fallback;
  }
  return CMS_BUTTON_STYLE_VALUES.has(fallback) ? fallback : "red-text-white";
}

export function getCmsButtonClass(
  style,
  extraClassName = "",
  fallback = "red-text-white",
) {
  const normalized = normalizeCmsButtonStyle(style, fallback);
  return [
    CMS_BUTTON_STYLE_CLASSES[normalized],
    "transition-colors",
    extraClassName,
  ]
    .filter(Boolean)
    .join(" ");
}
