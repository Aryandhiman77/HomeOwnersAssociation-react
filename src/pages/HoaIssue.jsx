import React, { useCallback, useState } from "react";
import image from "../assets/images/nonLegalHomeownerAdvocate.png";
import Separator from "../components/Elements/Separator";
import Button from "../components/Elements/Button";
import Dropbox from "../components/Dropbox";
import { postFormData } from "../lib/api";
import { addLocalQueueRecord } from "../lib/adminLocalQueues";
import { normalizeUsPhone } from "../lib/phone";

const issueOptions = [
  "Dispute Over Fines or Violations",
  "Unfair Fees or Assessments",
  "Harassment by HOA Board",
  "Property Damage Issues",
  "Rights and Access Denied",
  "Other",
];

const emptyFieldErrors = {
  name: "",
  email: "",
  state: "",
  phone: "",
  hoaName: "",
  bestTimeToCall: "",
  summary: "",
  issueTypes: "",
  keyDates: "",
  estimatedDamages: "",
  uploads: "",
  disclaimer: "",
};

const backendFieldMap = {
  adv_name: "name",
  adv_email: "email",
  adv_state: "state",
  adv_phone: "phone",
  adv_hoa_name: "hoaName",
  adv_best_time_to_call: "bestTimeToCall",
  adv_issue_summary: "summary",
  adv_issue_types: "issueTypes",
  adv_key_dates: "keyDates",
  adv_estimated_damages: "estimatedDamages",
  adv_uploads: "uploads",
  adv_disclaimer: "disclaimer",
};

const fieldFocusIds = {
  name: "username",
  email: "email",
  state: "state",
  phone: "phone",
  hoaName: "communityName",
  bestTimeToCall: "bestTimeToCall",
  summary: "message",
  issueTypes: "issue-type-0",
  keyDates: "specify",
  estimatedDamages: "estimatedDamages",
  uploads: "dropbox",
  disclaimer: "adv_disclaimer",
};

const invalidFieldClass =
  "border-red-600! bg-red-50! ring-1 ring-red-600 focus:outline-none";

const FieldError = ({ id, message }) =>
  message ? (
    <p id={id} role="alert" className="mt-1 text-sm font-semibold text-red-700">
      {message}
    </p>
  ) : null;

const HoaIssue = () => {
  const [uploads, setUploads] = useState([]);
  const [uploadResetKey, setUploadResetKey] = useState(0);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [fieldErrors, setFieldErrors] = useState(emptyFieldErrors);
  const [isSubmitting, setSubmitting] = useState(false);

  const clearFieldError = (field) => {
    setFieldErrors((current) =>
      current[field] ? { ...current, [field]: "" } : current,
    );
  };

  const handleUploadsChange = useCallback((files) => {
    setUploads(files);
    setFieldErrors((current) =>
      current.uploads ? { ...current, uploads: "" } : current,
    );
  }, []);

  const focusFirstInvalidField = (errors) => {
    const firstInvalidFieldName = Object.keys(fieldFocusIds).find(
      (field) => errors[field],
    );
    const firstInvalidId = fieldFocusIds[firstInvalidFieldName];

    window.requestAnimationFrame(() => {
      const firstInvalidField = document.getElementById(firstInvalidId);
      firstInvalidField?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      firstInvalidField?.focus({ preventScroll: true });
    });
  };

  const getBackendFieldErrors = (error) => {
    const responseErrors = error?.data?.errors;
    const nextErrors = { ...emptyFieldErrors };

    if (Array.isArray(responseErrors)) {
      responseErrors.forEach((item) => {
        const backendField = item?.path || item?.field || item?.param;
        const field = backendFieldMap[backendField];
        const message = item?.message || item?.msg || item?.error;
        if (field && message && !nextErrors[field]) {
          nextErrors[field] = String(message);
        }
      });
    } else if (responseErrors && typeof responseErrors === "object") {
      Object.entries(responseErrors).forEach(([backendField, value]) => {
        const field = backendFieldMap[backendField];
        const message = Array.isArray(value)
          ? value[0]?.message || value[0]?.msg || value[0]
          : value?.message || value?.msg || value;
        if (field && message) {
          nextErrors[field] = String(message);
        }
      });
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });
    setFieldErrors(emptyFieldErrors);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const advName = String(formData.get("adv_name") || "").trim();
    const advEmail = String(formData.get("adv_email") || "").trim();
    const phone = normalizeUsPhone(formData.get("adv_phone"));
    const advState = String(formData.get("adv_state") || "").trim();
    const advHoaName = String(formData.get("adv_hoa_name") || "").trim();
    const issueSummary = String(formData.get("adv_issue_summary") || "").trim();
    const estimatedDamages = String(
      formData.get("adv_estimated_damages") || "",
    ).trim();
    const keyDates = String(formData.get("adv_key_dates") || "").trim();
    const issueTypes = formData.getAll("adv_issue_types").map(String);
    const bestTimeToCall = String(formData.get("adv_best_time_to_call") || "");
    const acceptedDisclaimer = formData.get("adv_disclaimer") === "on";
    const nextFieldErrors = {
      name: advName.length >= 2 ? "" : "Please enter your name.",
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(advEmail)
        ? ""
        : "Please enter a valid email address.",
      state: advState ? "" : "Please enter your state.",
      phone: phone
        ? ""
        : "Please enter a valid US phone number, for example 1234567890.",
      hoaName: "",
      bestTimeToCall: ["morning", "afternoon", "evening", "night"].includes(
        bestTimeToCall,
      )
        ? ""
        : "Please select the best time to call.",
      summary:
        issueSummary.length >= 20
          ? ""
          : "Please describe your HOA problem in at least 20 characters.",
      issueTypes:
        issueTypes.length > 0 ? "" : "Please select at least one issue type.",
      keyDates: "",
      estimatedDamages: "",
      uploads: "",
      disclaimer: acceptedDisclaimer
        ? ""
        : "You must accept the disclaimer before requesting a consultation.",
    };

    if (Object.values(nextFieldErrors).some(Boolean)) {
      setFieldErrors(nextFieldErrors);
      focusFirstInvalidField(nextFieldErrors);
      return;
    }

    const payload = new FormData();
    payload.append("adv_name", advName);
    payload.append("adv_email", advEmail);
    payload.append("adv_phone", phone);

    payload.append("adv_state", advState);
    payload.append("adv_hoa_name", advHoaName);
    payload.append("adv_issue_summary", issueSummary);
    payload.append("adv_estimated_damages", estimatedDamages);
    payload.append("adv_key_dates", keyDates);
    payload.append("adv_issue_types", JSON.stringify(issueTypes));
    payload.append("adv_best_time_to_call", bestTimeToCall);
    payload.append("adv_disclaimer", acceptedDisclaimer ? "true" : "false");
    uploads.forEach((file) => payload.append("adv_uploads", file));

    setSubmitting(true);
    try {
      await postFormData("/api/public/non-legal-advocate/create", payload);
      addLocalQueueRecord("advocate", {
        adv_name: advName,
        adv_email: advEmail,
        adv_phone: phone,
        adv_state: advState,
        adv_hoa_name: advHoaName,
        adv_issue_summary: issueSummary,
        adv_estimated_damages: estimatedDamages,
        adv_key_dates: keyDates,
        adv_issue_types: issueTypes,
        adv_best_time_to_call: bestTimeToCall,
        status: "new",
        created_at: new Date().toISOString(),
      });
      form.reset();
      setUploads([]);
      setUploadResetKey((current) => current + 1);
      setFieldErrors(emptyFieldErrors);
      setStatus({
        type: "success",
        message: "Thank you! Your request has been submitted.",
      });
    } catch (error) {
      const backendErrors = getBackendFieldErrors(error);
      const hasBackendFieldErrors = Object.values(backendErrors).some(Boolean);

      if (hasBackendFieldErrors) {
        setFieldErrors(backendErrors);
        setStatus({
          type: "error",
          message: "Please correct the highlighted fields and try again.",
        });
        focusFirstInvalidField(backendErrors);
      } else {
        setStatus({ type: "error", message: error.message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <img src={image} className="w-full h-auto rounded-b-4xl mb-5" alt="" />
      <p className="bg-[#f7e8b5] capitalize text-gray-600 italic p-2 px-4 text-center mx-4 border border-amber-200 rounded-sm text-lg">
        <span className="font-semibold">full disclosure:</span> we are not
        attorneys. All responses are Non-Legal opinions only.
      </p>
      <div className="mx-auto text-[#273b72] text-lg max-w-4xl border border-[#273b72] my-5 p-5 sm:p-10">
        <div className="">
          <div className="text-center py-4 space-y-2">
            <p className="capitalize text-3xl font-semibold">
              Tell us about your hoa issue
            </p>
            <p className="text-xl italic">
              Please provide details below so we can better understand your
              situtation.
            </p>
          </div>
          <form onSubmit={handleSubmit} noValidate className="space-y-4 mt-5 ">
            <div>
              <label htmlFor="username" className="font-semibold">
                Your Name
              </label>
              <input
                type="text"
                id="username"
                name="adv_name"
                required
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={
                  fieldErrors.name ? "adv_name_error" : undefined
                }
                onChange={() => clearFieldError("name")}
                className={`border border-[#dad9db] w-full p-1 px-2 text-gray-600 bg-[#f6f7f8] rounded-sm ${
                  fieldErrors.name ? invalidFieldClass : ""
                }`}
              />
              <FieldError id="adv_name_error" message={fieldErrors.name} />
            </div>
            <div className="flex items-center gap-5">
              <div className="w-1/2">
                <label htmlFor="email" className="font-semibold">
                  Your Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="adv_email"
                  required
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email ? "adv_email_error" : undefined
                  }
                  onChange={() => clearFieldError("email")}
                  className={`border border-[#dad9db] w-full p-1 px-2 text-gray-600 bg-[#f6f7f8] rounded-sm ${
                    fieldErrors.email ? invalidFieldClass : ""
                  }`}
                />
                <FieldError id="adv_email_error" message={fieldErrors.email} />
              </div>
              <div className="w-1/2">
                <label htmlFor="state" className="font-semibold">
                  State
                </label>
                <input
                  type="text"
                  id="state"
                  name="adv_state"
                  required
                  aria-invalid={Boolean(fieldErrors.state)}
                  aria-describedby={
                    fieldErrors.state ? "adv_state_error" : undefined
                  }
                  onChange={() => clearFieldError("state")}
                  className={`border border-[#dad9db] w-full p-1 px-2 text-gray-600 bg-[#f6f7f8] rounded-sm ${
                    fieldErrors.state ? invalidFieldClass : ""
                  }`}
                />
                <FieldError id="adv_state_error" message={fieldErrors.state} />
              </div>
            </div>
            <div>
              <label htmlFor="communityName" className="font-semibold">
                Your Community or HOA
              </label>
              <input
                type="text"
                id="communityName"
                name="adv_hoa_name"
                aria-invalid={Boolean(fieldErrors.hoaName)}
                aria-describedby={
                  fieldErrors.hoaName ? "adv_hoa_name_error" : undefined
                }
                onChange={() => clearFieldError("hoaName")}
                className={`border border-[#dad9db] w-full p-1 px-2 text-gray-600 bg-[#f6f7f8] rounded-sm ${
                  fieldErrors.hoaName ? invalidFieldClass : ""
                }`}
              />
              <FieldError
                id="adv_hoa_name_error"
                message={fieldErrors.hoaName}
              />
            </div>
            <div className="flex items-center gap-5">
              <div className="w-1/2">
                <label htmlFor="phone" className="font-semibold">
                  Your Phone Number
                </label>
                <input
                  type="text"
                  id="phone"
                  name="adv_phone"
                  required
                  aria-invalid={Boolean(fieldErrors.phone)}
                  aria-describedby={
                    fieldErrors.phone ? "adv_phone_error" : undefined
                  }
                  onChange={() => clearFieldError("phone")}
                  className={`border border-[#dad9db] w-full p-1 px-2 text-gray-600 bg-[#f6f7f8] rounded-sm ${
                    fieldErrors.phone ? invalidFieldClass : ""
                  }`}
                />
                <FieldError id="adv_phone_error" message={fieldErrors.phone} />
              </div>
              <div className="w-1/2">
                <label htmlFor="bestTimeToCall">Best Time to Call</label>
                <select
                  id="bestTimeToCall"
                  name="adv_best_time_to_call"
                  required
                  defaultValue=""
                  aria-invalid={Boolean(fieldErrors.bestTimeToCall)}
                  aria-describedby={
                    fieldErrors.bestTimeToCall
                      ? "adv_best_time_to_call_error"
                      : undefined
                  }
                  onChange={() => clearFieldError("bestTimeToCall")}
                  className={`border border-[#dad9db] w-full p-2 px-2 text-gray-600 bg-[#f6f7f8] rounded-sm ${
                    fieldErrors.bestTimeToCall ? invalidFieldClass : ""
                  }`}
                >
                  <option value="" disabled>
                    Select a time
                  </option>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                  <option value="night">Night</option>
                </select>
                <FieldError
                  id="adv_best_time_to_call_error"
                  message={fieldErrors.bestTimeToCall}
                />
              </div>
            </div>
            <div>
              <label htmlFor="message">
                Brief Description of Your HOA Problem
              </label>
              <textarea
                placeholder="Describe your issue and alleged damages."
                id="message"
                name="adv_issue_summary"
                required
                minLength={20}
                aria-invalid={Boolean(fieldErrors.summary)}
                aria-describedby={
                  fieldErrors.summary ? "adv_summary_error" : undefined
                }
                onChange={() => clearFieldError("summary")}
                className={`border border-[#dad9db] w-full p-2 px-2 text-gray-600 bg-[#f6f7f8] rounded-sm italic ${
                  fieldErrors.summary ? invalidFieldClass : ""
                }`}
                rows={2}
              />
              <FieldError
                id="adv_summary_error"
                message={fieldErrors.summary}
              />
            </div>
            <div>
              <div
                role="group"
                aria-label="HOA issue types"
                aria-invalid={Boolean(fieldErrors.issueTypes)}
                aria-describedby={
                  fieldErrors.issueTypes ? "adv_issue_types_error" : undefined
                }
                className={`grid grid-cols-2 rounded-sm ${
                  fieldErrors.issueTypes
                    ? "border border-red-600 bg-red-50 p-2"
                    : ""
                }`}
              >
                {issueOptions.map((option, index) => (
                  <div key={option} className="space-x-1 space-y-4">
                    <input
                      type="checkbox"
                      id={`issue-type-${index}`}
                      name="adv_issue_types"
                      value={option}
                      onChange={() => clearFieldError("issueTypes")}
                    />
                    <label htmlFor={`issue-type-${index}`}>{option}</label>
                  </div>
                ))}
              </div>
              <FieldError
                id="adv_issue_types_error"
                message={fieldErrors.issueTypes}
              />
            </div>
            <div>
              <input
                type="text"
                id="specify"
                name="adv_key_dates"
                placeholder="Other details or key dates"
                aria-invalid={Boolean(fieldErrors.keyDates)}
                aria-describedby={
                  fieldErrors.keyDates ? "adv_key_dates_error" : undefined
                }
                onChange={() => clearFieldError("keyDates")}
                className={`border border-[#dad9db] w-full p-1 px-2 text-gray-600 bg-[#f6f7f8] rounded-sm ${
                  fieldErrors.keyDates ? invalidFieldClass : ""
                }`}
              />
              <FieldError
                id="adv_key_dates_error"
                message={fieldErrors.keyDates}
              />
            </div>
            <div>
              <input
                type="text"
                id="estimatedDamages"
                name="adv_estimated_damages"
                placeholder="Estimated damages, if any"
                aria-invalid={Boolean(fieldErrors.estimatedDamages)}
                aria-describedby={
                  fieldErrors.estimatedDamages
                    ? "adv_estimated_damages_error"
                    : undefined
                }
                onChange={() => clearFieldError("estimatedDamages")}
                className={`border border-[#dad9db] w-full p-1 px-2 text-gray-600 bg-[#f6f7f8] rounded-sm ${
                  fieldErrors.estimatedDamages ? invalidFieldClass : ""
                }`}
              />
              <FieldError
                id="adv_estimated_damages_error"
                message={fieldErrors.estimatedDamages}
              />
            </div>
            <div
              aria-invalid={Boolean(fieldErrors.uploads)}
              aria-describedby={
                fieldErrors.uploads ? "adv_uploads_error" : undefined
              }
            >
              <Dropbox
                key={uploadResetKey}
                disablePreviews={false}
                maxFiles={50}
                getFiles={handleUploadsChange}
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
              <FieldError
                id="adv_uploads_error"
                message={fieldErrors.uploads}
              />
            </div>
            <Separator className={"h-px! bg-[#cac9cd]!"} />
            <label
              htmlFor="adv_disclaimer"
              className={`flex cursor-pointer items-start gap-2 rounded-sm ${
                fieldErrors.disclaimer
                  ? "border border-red-600 bg-red-50 p-2"
                  : ""
              }`}
            >
              <input
                type="checkbox"
                id="adv_disclaimer"
                name="adv_disclaimer"
                required
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.disclaimer)}
                aria-describedby={
                  fieldErrors.disclaimer ? "adv_disclaimer_error" : undefined
                }
                onChange={() => clearFieldError("disclaimer")}
                className={`mt-1 shrink-0 accent-[#214780] ${
                  fieldErrors.disclaimer
                    ? "ring-2 ring-red-600 ring-offset-2"
                    : ""
                }`}
              />
              <span>
                <span className="font-semibold">Disclaimer:</span> Guidance
                provided is for informational purposes only and is not legal
                advice.
              </span>
            </label>
            <FieldError
              id="adv_disclaimer_error"
              message={fieldErrors.disclaimer}
            />
            {/* <div className=""> */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className={
                "bg-[#214780] text-white px-10 text-lg py-1! my-10 mx-auto rounded-md disabled:opacity-60"
              }
              title={isSubmitting ? "Submitting..." : "Request Consultation"}
            />
            {status.message && (
              <p
                className={`text-center font-semibold rounded-sm border px-4 py-3 ${
                  status.type === "success"
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {status.message}
              </p>
            )}
            {/* </div> */}
          </form>
        </div>
      </div>
    </div>
  );
};

export default HoaIssue;
