import React, { useMemo, useState } from "react";
import logoimage from "../assets/images/footerImage.png";
import Separator from "../components/Elements/Separator";
import { IoIosPaperPlane, IoIosWarning } from "react-icons/io";
import { FaLocationDot } from "react-icons/fa6";
import Dropbox from "../components/Dropbox";
import Button from "../components/Elements/Button";
import {
  BsFacebook,
  BsHouseDoorFill,
  BsLockFill,
  BsTwitterX,
} from "react-icons/bs";
import { FaCheckCircle } from "react-icons/fa";
import { postFormData } from "../lib/api";
import { normalizeUsPhone } from "../lib/phone";
import { US_STATE_OPTIONS, getCitiesForState } from "../lib/usLocationData";

const issueTypes = [
  "Fines or Violations",
  "Unfair Fees or Assessments",
  "Board Harassment",
  "Property Damage",
  "Neglect or Unsafe Conditions",
  "Selective Enforcement",
];

const emptyFieldErrors = {
  name: "",
  email: "",
  state: "",
  city: "",
  summary: "",
  issueTypes: "",
  body: "",
};

const invalidFieldClass =
  "border-[#c8102e]! bg-red-50! ring-1 ring-[#c8102e] focus:outline-none";

const FieldError = ({ id, message, className = "" }) =>
  message ? (
    <p
      id={id}
      role="alert"
      className={`mt-1 text-sm font-semibold text-[#b42318] ${className}`}
    >
      {message}
    </p>
  ) : null;

const SubmitYourStory = () => {
  const [uploads, setUploads] = useState([]);
  const [uploadResetKey, setUploadResetKey] = useState(0);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [agreementErrors, setAgreementErrors] = useState({
    disclaimer: false,
    consent: false,
  });
  const [fieldErrors, setFieldErrors] = useState(emptyFieldErrors);
  const [isSubmitting, setSubmitting] = useState(false);
  const [selectedPropertyState, setSelectedPropertyState] = useState("");
  const [selectedPropertyCity, setSelectedPropertyCity] = useState("");

  const propertyCityOptions = useMemo(
    () => getCitiesForState(selectedPropertyState),
    [selectedPropertyState],
  );
  const handlePropertyStateChange = (event) => {
    setSelectedPropertyState(event.target.value);
    setSelectedPropertyCity("");
    setFieldErrors((current) => ({ ...current, state: "", city: "" }));
  };

  const handlePropertyCityChange = (event) => {
    setSelectedPropertyCity(event.target.value);
    setFieldErrors((current) => ({ ...current, city: "" }));
  };

  const clearFieldError = (field) => {
    setFieldErrors((current) =>
      current[field] ? { ...current, [field]: "" } : current,
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });
    setAgreementErrors({ disclaimer: false, consent: false });
    setFieldErrors(emptyFieldErrors);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const selectedIssueTypes = formData.getAll("story_issue_type");
    const acceptedDisclaimer = formData.get("story_disclaimer") === "on";
    const acceptedConsent = formData.get("story_consent") === "on";
    const storyName = String(formData.get("story_name") || "").trim();
    const storyEmail = String(formData.get("story_email") || "").trim();
    const storyState = String(formData.get("story_state") || "").trim();
    const storyCity = String(formData.get("story_city") || "").trim();
    const storySummary = String(formData.get("story_summary") || "").trim();
    const primaryStoryBody = String(formData.get("story_body") || "").trim();
    const storyBody = [
      primaryStoryBody,
      formData.get("story_hoa_response"),
      formData.get("story_impact"),
    ]
      .filter(Boolean)
      .join("\n\n")
      .trim();
    const nextFieldErrors = {
      name:
        storyName.length >= 2
          ? ""
          : "Please enter your first and last name.",
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(storyEmail)
        ? ""
        : "Please enter a valid email address.",
      state: storyState ? "" : "Please select the property state.",
      city:
        !storyState || storyCity ? "" : "Please select the property city.",
      summary: storySummary ? "" : "Please enter a brief issue summary.",
      issueTypes:
        selectedIssueTypes.length > 0
          ? ""
          : "Please select at least one issue type.",
      body:
        primaryStoryBody.length >= 20
          ? ""
          : "Please describe what happened in at least 20 characters.",
    };
    const hasFieldErrors = Object.values(nextFieldErrors).some(Boolean);
    const hasAgreementErrors = !acceptedDisclaimer || !acceptedConsent;

    if (hasFieldErrors || hasAgreementErrors) {
      setFieldErrors(nextFieldErrors);
      setAgreementErrors({
        disclaimer: !acceptedDisclaimer,
        consent: !acceptedConsent,
      });

      const firstErrorId = [
        ["name", "story_name"],
        ["email", "story_email"],
        ["disclaimer", "story_disclaimer"],
        ["consent", "story_consent"],
        ["state", "story_state"],
        ["city", "story_city"],
        ["summary", "story_summary"],
        ["issueTypes", "story_issue_type_0"],
        ["body", "story_body"],
      ].find(([field]) =>
        field === "disclaimer"
          ? !acceptedDisclaimer
          : field === "consent"
            ? !acceptedConsent
            : Boolean(nextFieldErrors[field]),
      )?.[1];

      window.requestAnimationFrame(() => {
        const firstInvalidField = document.getElementById(firstErrorId);
        firstInvalidField?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        firstInvalidField?.focus({ preventScroll: true });
      });
      return;
    }

    const payload = new FormData();
    payload.append("story_name", storyName);
    payload.append("story_email", storyEmail);
    payload.append("story_city", storyCity);
    payload.append("story_state", storyState);
    payload.append(
      "story_hoa_name",
      String(formData.get("story_hoa_name") || "").trim(),
    );
    payload.append("story_issue_type", JSON.stringify(selectedIssueTypes));
    payload.append("story_summary", storySummary);
    payload.append("story_body", storyBody);
    payload.append(
      "story_anonymous",
      formData.get("story_anonymous") === "on" ? "true" : "false",
    );
    payload.append("story_disclaimer", acceptedDisclaimer ? "true" : "false");
    payload.append("story_consent", acceptedConsent ? "true" : "false");
    const phoneInput = String(formData.get("story_phone") || "").trim();
    const phone = normalizeUsPhone(phoneInput);
    if (phoneInput && !phone) {
      setStatus({
        type: "error",
        message: "Phone must be a valid US number, for example 1234567890.",
      });
      setSubmitting(false);
      return;
    }
    if (phone) {
      payload.append("story_phone", phone);
    }
    uploads.forEach((file) => payload.append("uploads", file));

    setSubmitting(true);
    try {
      await postFormData("/submit-story", payload);
      form.reset();
      setUploads([]);
      setUploadResetKey((current) => current + 1);
      setSelectedPropertyState("");
      setSelectedPropertyCity("");
      setAgreementErrors({ disclaimer: false, consent: false });
      setFieldErrors(emptyFieldErrors);
      setStatus({
        type: "success",
        message:
          "Your story was saved for admin review. It will not be auto-published.",
      });
    } catch (error) {
      console.error("Story submission error:", error);
      let errorMessage = error.message;

      if (errorMessage.includes("next is not a function")) {
        errorMessage =
          "Story submission backend is running an outdated save hook. Deploy the latest backend code, then try again.";
      }

      setStatus({ type: "error", message: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full my-10 px-4">
      <div>
        <form onSubmit={handleSubmit} noValidate className="text-lg mt-4">
          <div className="flex flex-col gap-8 sm:flex-row">
            <div className="w-full sm:w-[50%] space-y-4">
              <div className="logo">
                <img src={logoimage} alt="HOA" className="h-20" />
              </div>
              <span className="text-2xl font-medium text-white bg-black rounded-lg p-3">
                MY HOA Nightmare
              </span>
              <p className="text-xl italic mt-5 font-semibold">
                How an HOA management failure turned into a homeowner nightmare.
              </p>
              <Separator className={"bg-[#e5e5e5] my-4"} />
              <div>
                <label htmlFor="story_name">
                  <b>Your Name</b>
                </label>
                <input
                  type="text"
                  placeholder="First and Last Name"
                  id="story_name"
                  name="story_name"
                  required
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? "story_name_error" : undefined}
                  onChange={() => clearFieldError("name")}
                  className={`mx-2 border rounded-md border-[#b5b5b5] p-1 px-2 w-full max-w-xs ${
                    fieldErrors.name ? invalidFieldClass : ""
                  }`}
                />
                <FieldError
                  id="story_name_error"
                  message={fieldErrors.name}
                  className="ml-2"
                />
              </div>
              <div>
                <label htmlFor="story_email">
                  <b>Your Email</b>
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  id="story_email"
                  name="story_email"
                  required
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email ? "story_email_error" : undefined
                  }
                  onChange={() => clearFieldError("email")}
                  className={`mx-2 border rounded-md border-[#b5b5b5] p-1 px-2 w-full max-w-xs ${
                    fieldErrors.email ? invalidFieldClass : ""
                  }`}
                />
                <FieldError
                  id="story_email_error"
                  message={fieldErrors.email}
                  className="ml-2"
                />
              </div>
            </div>
            <div className="w-full sm:w-[50%]">
              <div className="disclaimer space-y-3 rounded-lg border-2 border-[#e6e6e6] bg-[#f4f5f7] p-3 text-black mb-2">
                <label
                  htmlFor="story_disclaimer"
                  className="flex cursor-pointer items-start gap-3"
                >
                  <input
                    id="story_disclaimer"
                    name="story_disclaimer"
                    type="checkbox"
                    aria-required="true"
                    aria-invalid={agreementErrors.disclaimer}
                    onChange={() =>
                      setAgreementErrors((current) => ({
                        ...current,
                        disclaimer: false,
                      }))
                    }
                    className={`mt-1.5 h-4 w-4 shrink-0 accent-[#00733a] transition-shadow ${
                      agreementErrors.disclaimer
                        ? "ring-2 ring-[#c8102e] ring-offset-2"
                        : ""
                    }`}
                  />
                  <span className="text-base leading-snug">
                    <span className="mr-1.5 inline-flex items-center gap-1 align-middle">
                      <IoIosWarning size={20} aria-hidden="true" />
                      <span className="font-bold text-lg">Disclaimer:</span>
                    </span>
                    I fully understand this submission is my opinion and
                    responsibility. I confirm this submission is truthful to the
                    best of my knowledge and does not intentionally contain
                    false or defamatory statements.
                  </span>
                </label>
                <p>
                  This website publishes user-submitted stories and allegations
                  that are not independently verified. HOANightmares.org does
                  not endorse or validate any claims. Content reflects the
                  opinions of individual contributors only.
                </p>
                <label
                  htmlFor="story_consent"
                  className="flex cursor-pointer items-start gap-3 border-t border-[#d8dadd] pt-3"
                >
                  <input
                    id="story_consent"
                    name="story_consent"
                    type="checkbox"
                    aria-required="true"
                    aria-invalid={agreementErrors.consent}
                    onChange={() =>
                      setAgreementErrors((current) => ({
                        ...current,
                        consent: false,
                      }))
                    }
                    className={`mt-0.5 h-4 w-4 shrink-0 accent-[#00733a] transition-shadow ${
                      agreementErrors.consent
                        ? "ring-2 ring-[#c8102e] ring-offset-2"
                        : ""
                    }`}
                  />
                  <span className="font-semibold italic leading-snug">
                    Users are solely responsible for submitted content.
                  </span>
                </label>
              </div>
              <label htmlFor="story_anonymous">
                <input
                  id="story_anonymous"
                  name="story_anonymous"
                  type="checkbox"
                />
                <span className="font-semibold"> Remain Anonymous </span>
                <i className="opacity-[0.6]">
                  Your identity will be kept private.
                </i>
              </label>
            </div>
          </div>
          <div className="mt-4 border-2 border-[#1379e7] bg-[#edf4fe] rounded-lg">
            <div className="p-4">
              <div className="flex gap-2">
                <FaLocationDot size={30} className="" color="#0c67ca" />
                <div>
                  <h1 className="text-lg font-semibold">
                    Location of HOA Property
                  </h1>
                  <p className="text-gray-600">
                    Help us organize your story by location to connect
                    homeowners with the right resources.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                <div>
                  <label htmlFor="story_state" className="font-semibold">
                    State
                  </label>
                  <select
                    id="story_state"
                    name="story_state"
                    required
                    value={selectedPropertyState}
                    onChange={handlePropertyStateChange}
                    aria-invalid={Boolean(fieldErrors.state)}
                    aria-describedby={
                      fieldErrors.state ? "story_state_error" : undefined
                    }
                    className={`border rounded-md border-[#b5b5b5] w-full bg-white p-2 ${
                      fieldErrors.state ? invalidFieldClass : ""
                    }`}
                  >
                    <option value="">Select State</option>
                    {US_STATE_OPTIONS.map((stateName) => (
                      <option key={stateName} value={stateName}>
                        {stateName}
                      </option>
                    ))}
                  </select>
                  <FieldError
                    id="story_state_error"
                    message={fieldErrors.state}
                  />
                </div>
                <div>
                  <label htmlFor="story_city" className="font-semibold">
                    City
                  </label>
                  <select
                    id="story_city"
                    name="story_city"
                    required
                    value={selectedPropertyCity}
                    onChange={handlePropertyCityChange}
                    disabled={!selectedPropertyState}
                    aria-invalid={Boolean(fieldErrors.city)}
                    aria-describedby={
                      fieldErrors.city ? "story_city_error" : undefined
                    }
                    className={`border rounded-md border-[#b5b5b5] w-full bg-white p-2 ${
                      !selectedPropertyState
                        ? "cursor-not-allowed opacity-60"
                        : ""
                    } ${fieldErrors.city ? invalidFieldClass : ""}`}
                  >
                    <option value="">
                      {selectedPropertyState
                        ? "Select City"
                        : "Select State First"}
                    </option>
                    {propertyCityOptions.map((cityName) => (
                      <option key={cityName} value={cityName}>
                        {cityName}
                      </option>
                    ))}
                  </select>
                  <FieldError
                    id="story_city_error"
                    message={fieldErrors.city}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="w-full space-y-3">
            <div>
              <label htmlFor="story_hoa_name" className="font-semibold text-xl">
                My Community HOA{" "}
                <span className="font-normal text-gray-500 text-lg">
                  (Name of your HOA)
                </span>
              </label>
              <input
                type="text"
                id="story_hoa_name"
                name="story_hoa_name"
                placeholder="e.g., Sunset Meadows Homeowners Association"
                className="border rounded-md border-[#b5b5b5] p-1 px-2 w-full bg-white"
              />
            </div>
            <div>
              <label htmlFor="story_summary" className="font-semibold text-xl">
                Brief Issue Summary{" "}
                <span className="font-normal text-gray-500 text-lg">
                  (One line that describes the main issue.)
                </span>
              </label>
              <input
                type="text"
                id="story_summary"
                name="story_summary"
                required
                maxLength={300}
                aria-invalid={Boolean(fieldErrors.summary)}
                aria-describedby={
                  fieldErrors.summary ? "story_summary_error" : undefined
                }
                onChange={() => clearFieldError("summary")}
                placeholder="Unsafe living conditions due to neglect and management failure"
                className={`border rounded-md border-[#b5b5b5] p-1 px-2 w-full bg-white ${
                  fieldErrors.summary ? invalidFieldClass : ""
                }`}
              />
              <FieldError
                id="story_summary_error"
                message={fieldErrors.summary}
              />
            </div>
            <div>
              <div
                role="group"
                aria-label="Issue types"
                aria-invalid={Boolean(fieldErrors.issueTypes)}
                aria-describedby={
                  fieldErrors.issueTypes
                    ? "story_issue_type_error"
                    : undefined
                }
                className={`grid grid-cols-2 gap-2 rounded-md ${
                  fieldErrors.issueTypes
                    ? "border border-[#c8102e] bg-red-50 p-2"
                    : ""
                }`}
              >
                {issueTypes.map((issue, index) => (
                  <label key={issue} className="flex items-center gap-2">
                    <input
                      id={`story_issue_type_${index}`}
                      type="checkbox"
                      name="story_issue_type"
                      value={issue}
                      onChange={() => clearFieldError("issueTypes")}
                    />
                    {issue}
                  </label>
                ))}
              </div>
              <FieldError
                id="story_issue_type_error"
                message={fieldErrors.issueTypes}
              />
            </div>
            <div>
              <label htmlFor="story_body" className="font-semibold text-xl">
                What Happened as a Homeowner?{" "}
                <span className="font-normal text-gray-500 text-lg">
                  (Describe the situation in detail.)
                </span>
              </label>
              <textarea
                id="story_body"
                name="story_body"
                required
                minLength={20}
                rows={2}
                aria-invalid={Boolean(fieldErrors.body)}
                aria-describedby={
                  fieldErrors.body ? "story_body_error" : undefined
                }
                onChange={() => clearFieldError("body")}
                className={`border rounded-md border-[#b5b5b5] p-1 px-2 w-full bg-white ${
                  fieldErrors.body ? invalidFieldClass : ""
                }`}
              />
              <FieldError id="story_body_error" message={fieldErrors.body} />
            </div>
            <div>
              <label htmlFor="story_hoa_response" className="font-bold text-xl">
                What was your HOA's Response?{" "}
                <span className="font-normal text-gray-500 text-lg">
                  (How did the HOA or management company handle (or fail to
                  handle) the issue?)
                </span>
              </label>
              <textarea
                id="story_hoa_response"
                name="story_hoa_response"
                rows={2}
                className="border rounded-md border-[#b5b5b5] p-1 px-2 w-full bg-white"
              />
            </div>
            <div>
              <label htmlFor="story_impact" className="font-bold text-xl">
                What was the Impact or Damage?{" "}
                <span className="font-normal text-gray-500 text-lg">
                  (Financial loss, property damage, emotional distress, unsafe
                  conditions, etc.)
                </span>
              </label>
              <textarea
                id="story_impact"
                name="story_impact"
                rows={2}
                className="border rounded-md border-[#b5b5b5] p-1 px-2 w-full bg-white"
              />
            </div>
            <Dropbox
              key={uploadResetKey}
              disablePreviews={false}
              maxFiles={50}
              getFiles={setUploads}
              allowedMimeTypes={[
                "image/png",
                "image/jpg",
                "image/jpeg",
                "image/webp",
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "video/mp4",
                "video/mpeg",
                "video/quicktime",
                "video/x-msvideo",
                "video/webm",
              ]}
              sizePerFile="20MB"
            />
          </div>
          <Separator className={"bg-[#cfcfd1]! mb-4"} />
          <div>
            <h2 className="text-xl font-semibold text-center">
              Do you want to link your story to:
            </h2>
            <p className="text-[15px] opacity-[0.5] text-center">
              Share your story to help warn neighbors and spread awareness.
            </p>
            <div className="flex gap-4 flex-row mt-3">
              <Button
                type="button"
                className={
                  "bg-[#058744] px-4! py-1! text-white rounded-lg w-full justify-center gap-3 hover:opacity-[0.9]"
                }
                title="Share to Nextdoor"
                startIcon={<BsHouseDoorFill size={18} />}
              />
              <Button
                type="button"
                className={
                  "bg-[#1356bf] px-4! py-1! text-white rounded-lg w-full justify-center  gap-3 hover:opacity-[0.9]"
                }
                title="Share to Facebook"
                startIcon={<BsFacebook size={18} />}
              />
              <Button
                type="button"
                className={
                  "bg-[#000000] px-4! py-1! text-white rounded-lg w-full justify-center gap-3 hover:opacity-[0.9]"
                }
                title="Share to Twitter"
                startIcon={<BsTwitterX size={18} />}
              />
            </div>
            <p className="text-[15px] opacity-[0.5] mt-2 flex justify-center">
              <span>
                <BsLockFill />
              </span>
              <span>
                You'll be able to review before posting. We never post without
                your permission.
              </span>
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className={
                "bg-[#aa1310] px-4! py-1! text-white rounded-lg w-full hover:opacity-[0.9] text-lg my-3 disabled:opacity-60"
              }
            >
              <div className="flex flex-col">
                <div className="flex flex-row gap-2 justify-center">
                  <span>
                    <IoIosPaperPlane size={24} />
                  </span>
                  <h2 className="text-lg font-semibold">
                    {isSubmitting
                      ? "Submitting..."
                      : "Submit your HOA Nightmare"}
                  </h2>
                </div>
                <div className="text-sm flex justify-center">
                  Your story will help protect other homeowners.
                </div>
              </div>
            </button>
            {status.message && (
              <p
                aria-live="polite"
                className={`text-center font-semibold rounded-sm border px-4 py-3 ${
                  status.type === "success"
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {status.message}
              </p>
            )}
          </div>
          <div className="text-[15px] opacity-[0.5] text-center">
            <div className="inline-flex">
              <span className="p-0.5 mx-1">
                <FaCheckCircle color="green" />
              </span>
              <span>
                100% free &middot; Anonymous Option &middot; Makes a Difference
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitYourStory;
