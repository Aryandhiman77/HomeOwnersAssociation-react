import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaGavel, FaCheckCircle } from "react-icons/fa";
import { MdKeyboardArrowLeft } from "react-icons/md";
import { postJson } from "../../lib/api";
import { normalizeUsPhone } from "../../lib/phone";
import { US_STATE_OPTIONS, getCitiesForState } from "../../lib/usLocationData";

const PRACTICE_OPTIONS = [
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

const emptyFieldErrors = {
  name: "",
  firm: "",
  email: "",
  phone: "",
  website: "",
  state: "",
  city: "",
  practiceAreas: "",
  summary: "",
  disclaimer: "",
};

const invalidInputCls =
  "border-red-600! bg-red-50! ring-1 ring-red-600 focus:border-red-600!";

const AttorneySubmissionForm = () => {
  const [isSubmitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState(emptyFieldErrors);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const cityOptions = useMemo(
    () => getCitiesForState(selectedState),
    [selectedState],
  );

  const handleStateChange = (event) => {
    setSelectedState(event.target.value);
    setSelectedCity("");
    setFieldErrors((current) => ({ ...current, state: "", city: "" }));
  };

  const clearFieldError = (field) => {
    setFieldErrors((current) =>
      current[field] ? { ...current, [field]: "" } : current,
    );
  };

  /* practice areas are multi-select */
  const [practiceAreas, setPracticeAreas] = useState([]);

  const togglePractice = (area) => {
    clearFieldError("practiceAreas");
    setPracticeAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors(emptyFieldErrors);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const attorneyName = String(fd.get("attorney_name") || "").trim();
    const attorneyFirm = String(fd.get("attorney_firm") || "").trim();
    const attorneyEmail = String(fd.get("attorney_email") || "").trim();
    const attorneyPhone = normalizeUsPhone(fd.get("attorney_phone"));
    const attorneyWebsite = String(fd.get("attorney_website") || "").trim();
    const attorneySummary = String(fd.get("attorney_summary") || "").trim();
    const acceptedDisclaimer = fd.get("attorney_disclaimer_ack") === "on";
    let hasValidWebsite = true;

    if (attorneyWebsite) {
      try {
        const websiteUrl = new URL(attorneyWebsite);
        hasValidWebsite = ["http:", "https:"].includes(websiteUrl.protocol);
      } catch {
        hasValidWebsite = false;
      }
    }

    const nextFieldErrors = {
      name:
        attorneyName.length >= 2 ? "" : "Please enter the attorney name.",
      firm: attorneyFirm.length >= 2 ? "" : "Please enter the firm name.",
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attorneyEmail)
        ? ""
        : "Please enter a valid email address.",
      phone: attorneyPhone
        ? ""
        : "Please enter a valid US phone number, for example 8005551234.",
      website: hasValidWebsite
        ? ""
        : "Please enter a complete website URL beginning with http:// or https://.",
      state: selectedState ? "" : "Please select a state.",
      city: !selectedState || selectedCity ? "" : "Please select a city.",
      practiceAreas:
        practiceAreas.length > 0
          ? ""
          : "Please select at least one practice area.",
      summary:
        attorneySummary.length >= 20
          ? ""
          : "Please enter a summary of at least 20 characters.",
      disclaimer: acceptedDisclaimer
        ? ""
        : "You must accept the attorney disclaimer before submitting.",
    };

    if (Object.values(nextFieldErrors).some(Boolean)) {
      setFieldErrors(nextFieldErrors);
      const firstInvalidId = [
        ["name", "attorney_name"],
        ["firm", "attorney_firm"],
        ["email", "attorney_email"],
        ["phone", "attorney_phone"],
        ["website", "attorney_website"],
        ["state", "attorney_state"],
        ["city", "attorney_city"],
        ["practiceAreas", "attorney_practice_0"],
        ["summary", "attorney_summary"],
        ["disclaimer", "attorney_disclaimer_ack"],
      ].find(([field]) => nextFieldErrors[field])?.[1];

      window.requestAnimationFrame(() => {
        const firstInvalidField = document.getElementById(firstInvalidId);
        firstInvalidField?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        firstInvalidField?.focus({ preventScroll: true });
      });
      return;
    }

    const payload = {
      attorney_name: attorneyName,
      attorney_firm: attorneyFirm,
      attorney_email: attorneyEmail,
      attorney_phone: attorneyPhone,
      attorney_website: attorneyWebsite || null,
      attorney_city: selectedCity,
      attorney_state: selectedState,
      attorney_county: String(fd.get("attorney_county") || "").trim() || null,
      attorney_practice_areas: practiceAreas,
      attorney_summary: attorneySummary,
      attorney_bio: String(fd.get("attorney_bio") || "").trim() || null,
      attorney_disclaimer_ack: acceptedDisclaimer,
    };

    setSubmitting(true);
    try {
      await postJson("/api/public/attorney-submission", payload);
      setSubmitted(true);
      form.reset();
      setPracticeAreas([]);
      setSelectedState("");
      setSelectedCity("");
      setFieldErrors(emptyFieldErrors);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success screen ── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <FaCheckCircle size={56} className="mx-auto text-[#0a4d2c] mb-6" />
          <h1 className="text-[28px] font-bold text-[#0a4d2c] mb-3">
            Submission Received
          </h1>
          <p className="text-[#555555] text-[15px] leading-relaxed mb-8">
            Thank you for submitting your attorney listing. Our team will review
            your profile and notify you once it's approved. This process
            typically takes 1–3 business days.
          </p>
          <Link
            to="/find-attorney"
            className="inline-flex items-center gap-2 bg-[#0a4d2c] text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-colors"
          >
            Back to Attorney Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f7] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* back link */}
        <Link
          to="/find-attorney"
          className="inline-flex items-center gap-1 text-[#0a4d2c] text-[14px] font-semibold mb-6 hover:underline"
        >
          <MdKeyboardArrowLeft size={20} /> Back to Attorney Directory
        </Link>

        {/* form card */}
        <div className="bg-white rounded-[20px] border border-[#eeeeee] shadow-sm p-8 md:p-12">
          {/* heading */}
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-[#0a4d2c] w-14 h-14 rounded-[12px] flex items-center justify-center shrink-0">
              <FaGavel size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-[26px] font-bold text-[#0a4d2c]">
                Submit Your Attorney Listing
              </h1>
              <p className="text-[#666666] text-sm mt-0.5">
                Listings are reviewed before going live. All fields marked * are
                required.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 font-semibold text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* ── Section: Personal Info ── */}
            <Section title="Attorney Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field
                  label="Attorney Name *"
                  error={fieldErrors.name}
                  errorId="attorney_name_error"
                >
                  <input
                    id="attorney_name"
                    name="attorney_name"
                    required
                    aria-invalid={Boolean(fieldErrors.name)}
                    aria-describedby={
                      fieldErrors.name ? "attorney_name_error" : undefined
                    }
                    onChange={() => clearFieldError("name")}
                    placeholder="e.g. Jane Lawyer"
                    className={`${inputCls} ${fieldErrors.name ? invalidInputCls : ""}`}
                  />
                </Field>
                <Field
                  label="Firm Name *"
                  error={fieldErrors.firm}
                  errorId="attorney_firm_error"
                >
                  <input
                    id="attorney_firm"
                    name="attorney_firm"
                    required
                    aria-invalid={Boolean(fieldErrors.firm)}
                    aria-describedby={
                      fieldErrors.firm ? "attorney_firm_error" : undefined
                    }
                    onChange={() => clearFieldError("firm")}
                    placeholder="e.g. Jane Law LLC"
                    className={`${inputCls} ${fieldErrors.firm ? invalidInputCls : ""}`}
                  />
                </Field>
                <Field
                  label="Email Address *"
                  error={fieldErrors.email}
                  errorId="attorney_email_error"
                >
                  <input
                    id="attorney_email"
                    name="attorney_email"
                    type="email"
                    required
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={
                      fieldErrors.email ? "attorney_email_error" : undefined
                    }
                    onChange={() => clearFieldError("email")}
                    placeholder="jane@example.com"
                    className={`${inputCls} ${fieldErrors.email ? invalidInputCls : ""}`}
                  />
                </Field>
                <Field
                  label="Phone Number *"
                  error={fieldErrors.phone}
                  errorId="attorney_phone_error"
                >
                  <input
                    id="attorney_phone"
                    name="attorney_phone"
                    type="tel"
                    required
                    placeholder="10 digits, e.g. 8005551234"
                    pattern="^\+?1?\d{10}$"
                    title="Enter a 10-digit US phone number"
                    aria-invalid={Boolean(fieldErrors.phone)}
                    aria-describedby={
                      fieldErrors.phone ? "attorney_phone_error" : undefined
                    }
                    onChange={() => clearFieldError("phone")}
                    className={`${inputCls} ${fieldErrors.phone ? invalidInputCls : ""}`}
                  />
                </Field>
                <Field
                  label="Website URL"
                  error={fieldErrors.website}
                  errorId="attorney_website_error"
                >
                  <input
                    id="attorney_website"
                    name="attorney_website"
                    type="url"
                    aria-invalid={Boolean(fieldErrors.website)}
                    aria-describedby={
                      fieldErrors.website
                        ? "attorney_website_error"
                        : undefined
                    }
                    onChange={() => clearFieldError("website")}
                    placeholder="https://yourfirm.com"
                    className={`${inputCls} ${fieldErrors.website ? invalidInputCls : ""}`}
                  />
                </Field>
              </div>
            </Section>

            {/* ── Section: Location ── */}
            <Section title="Location">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Field
                  label="State *"
                  error={fieldErrors.state}
                  errorId="attorney_state_error"
                >
                  <select
                    id="attorney_state"
                    name="attorney_state"
                    required
                    value={selectedState}
                    onChange={handleStateChange}
                    aria-invalid={Boolean(fieldErrors.state)}
                    aria-describedby={
                      fieldErrors.state ? "attorney_state_error" : undefined
                    }
                    className={`${inputCls} ${fieldErrors.state ? invalidInputCls : ""}`}
                  >
                    <option value="" disabled>
                      Select state
                    </option>
                    {US_STATE_OPTIONS.map((stateName) => (
                      <option key={stateName} value={stateName}>
                        {stateName}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="City *"
                  error={fieldErrors.city}
                  errorId="attorney_city_error"
                >
                  <select
                    id="attorney_city"
                    name="attorney_city"
                    required
                    value={selectedCity}
                    onChange={(event) => {
                      setSelectedCity(event.target.value);
                      clearFieldError("city");
                    }}
                    disabled={!selectedState}
                    aria-invalid={Boolean(fieldErrors.city)}
                    aria-describedby={
                      fieldErrors.city ? "attorney_city_error" : undefined
                    }
                    className={`${inputCls} ${!selectedState ? "cursor-not-allowed opacity-60" : ""} ${fieldErrors.city ? invalidInputCls : ""}`}
                  >
                    <option value="" disabled>
                      {selectedState ? "Select city" : "Select state first"}
                    </option>
                    {cityOptions.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="County (optional)">
                  <input
                    name="attorney_county"
                    placeholder="e.g. Hillsborough"
                    className={inputCls}
                  />
                </Field>
              </div>
            </Section>

            {/* ── Section: Practice Areas ── */}
            <Section title="Practice Areas *">
              <p className="text-[13px] text-[#888888] mb-3">
                Select all that apply (minimum 1).
              </p>
              <div
                role="group"
                aria-label="Practice areas"
                aria-invalid={Boolean(fieldErrors.practiceAreas)}
                aria-describedby={
                  fieldErrors.practiceAreas
                    ? "attorney_practice_areas_error"
                    : undefined
                }
                className={`grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg ${
                  fieldErrors.practiceAreas
                    ? "border border-red-600 bg-red-50 p-2"
                    : ""
                }`}
              >
                {PRACTICE_OPTIONS.map((area, index) => (
                  <label
                    key={area}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer text-[13px] font-medium transition-colors
                      ${
                        practiceAreas.includes(area)
                          ? "border-[#0a4d2c] bg-[#f0f4f1] text-[#0a4d2c]"
                          : "border-[#dddddd] text-[#555555] hover:border-[#0a4d2c] hover:bg-[#f9f9f7]"
                      }`}
                  >
                    <input
                      id={`attorney_practice_${index}`}
                      type="checkbox"
                      checked={practiceAreas.includes(area)}
                      onChange={() => togglePractice(area)}
                      className="accent-[#0a4d2c]"
                    />
                    {area}
                  </label>
                ))}
              </div>
              {fieldErrors.practiceAreas && (
                <p
                  id="attorney_practice_areas_error"
                  role="alert"
                  className="mt-1 text-[12px] font-semibold text-red-700"
                >
                  {fieldErrors.practiceAreas}
                </p>
              )}
            </Section>

            {/* ── Section: Profile Text ── */}
            <Section title="Profile Details">
              <Field
                label="Short Summary *"
                hint="Max 300 characters shown on the listing card."
                error={fieldErrors.summary}
                errorId="attorney_summary_error"
              >
                <textarea
                  id="attorney_summary"
                  name="attorney_summary"
                  required
                  rows={3}
                  maxLength={500}
                  aria-invalid={Boolean(fieldErrors.summary)}
                  aria-describedby={
                    fieldErrors.summary
                      ? "attorney_summary_error"
                      : undefined
                  }
                  onChange={() => clearFieldError("summary")}
                  placeholder="Brief description of your practice and how you help homeowners."
                  className={`${inputCls} ${fieldErrors.summary ? invalidInputCls : ""}`}
                />
              </Field>
              <div className="mt-5">
                <Field
                  label="Full Bio (optional)"
                  hint="Longer profile bio visible on your detail page."
                >
                  <textarea
                    name="attorney_bio"
                    rows={5}
                    placeholder="Your background, experience, notable cases, and approach..."
                    className={inputCls}
                  />
                </Field>
              </div>
            </Section>

            {/* ── Disclaimer ── */}
            <div
              className={`rounded-lg border bg-[#f9f9f7] p-4 ${
                fieldErrors.disclaimer
                  ? "border-red-600 bg-red-50"
                  : "border-[#dddddd]"
              }`}
            >
              <label
                htmlFor="attorney_disclaimer_ack"
                className="flex items-start gap-3 cursor-pointer"
              >
                <input
                  id="attorney_disclaimer_ack"
                  type="checkbox"
                  name="attorney_disclaimer_ack"
                  required
                  aria-required="true"
                  aria-invalid={Boolean(fieldErrors.disclaimer)}
                  aria-describedby={
                    fieldErrors.disclaimer
                      ? "attorney_disclaimer_error"
                      : undefined
                  }
                  onChange={() => clearFieldError("disclaimer")}
                  className={`mt-0.5 accent-[#0a4d2c] ${
                    fieldErrors.disclaimer
                      ? "ring-2 ring-red-600 ring-offset-2"
                      : ""
                  }`}
                />
                <span className="text-[13px] text-[#333333] font-medium">
                  I have read and agree to the{" "}
                  <Link
                    to="/attorney-disclaimer"
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="font-bold text-[#0a4d2c] underline decoration-1 underline-offset-2 hover:text-black"
                  >
                    attorney disclaimer
                  </Link>{" "}
                  and confirm all submitted information is accurate. *
                </span>
              </label>
              {fieldErrors.disclaimer && (
                <p
                  id="attorney_disclaimer_error"
                  role="alert"
                  className="mt-2 text-[12px] font-semibold text-red-700"
                >
                  {fieldErrors.disclaimer}
                </p>
              )}
            </div>

            {/* ── Submit ── */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0a4d2c] text-white py-4 rounded-xl font-bold text-[15px] hover:bg-black transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <FaGavel size={16} /> Submit Attorney Listing
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ── helpers ── */
const inputCls =
  "w-full px-3 py-2.5 border border-[#dddddd] rounded-lg text-[14px] text-[#333333] bg-white focus:outline-none focus:border-[#0a4d2c] transition-colors";

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-[15px] font-bold text-[#333333] mb-4 pb-2 border-b border-[#eeeeee]">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, hint, error, errorId, children }) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-[#444444] mb-1.5">
        {label}
      </label>
      {hint && <p className="text-[11px] text-[#888888] mb-1.5">{hint}</p>}
      {children}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1 text-[12px] font-semibold text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default AttorneySubmissionForm;
