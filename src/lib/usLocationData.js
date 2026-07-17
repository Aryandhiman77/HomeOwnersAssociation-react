import usStatesCitiesZips from "../../us_states_cities_zips.json";

const STATE_ABBREVIATIONS = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
};

export const US_STATE_OPTIONS = Object.keys(usStatesCitiesZips).sort((a, b) =>
  a.localeCompare(b),
);

const STATE_NAME_LOOKUP = US_STATE_OPTIONS.reduce((lookup, stateName) => {
  lookup[stateName.toLowerCase()] = stateName;
  return lookup;
}, {});

export function normalizeUsState(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized || normalized === "other") return "";

  const abbreviationMatch = STATE_ABBREVIATIONS[normalized.toUpperCase()];
  if (abbreviationMatch && usStatesCitiesZips[abbreviationMatch]) {
    return abbreviationMatch;
  }

  return STATE_NAME_LOOKUP[normalized] || "";
}

export function getCitiesForState(stateName) {
  const cityZipMap = usStatesCitiesZips[stateName];
  if (!cityZipMap || typeof cityZipMap !== "object") return [];

  return Object.keys(cityZipMap).sort((a, b) => a.localeCompare(b));
}

export function getZipCodesForCity(stateName, cityName) {
  const zipCodes = usStatesCitiesZips[stateName]?.[cityName];
  return Array.isArray(zipCodes) ? zipCodes : [];
}
