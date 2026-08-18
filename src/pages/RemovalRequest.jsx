import React, { useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiSend } from "react-icons/fi";
import DocumentPageHeader from "../components/DocumentPageHeader";
import { postJson } from "../lib/api";

const CASE_ID_PATTERN = /^STORY-[A-Z0-9]{15}$/i;

const initialForm = {
  caseId: "",
  name: "",
  email: "",
  reason: "",
};

const RemovalRequest = () => {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setSubmitting] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (status.message) setStatus({ type: "", message: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      caseId: form.caseId.trim().toUpperCase(),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      reason: form.reason.trim(),
    };

    if (!CASE_ID_PATTERN.test(payload.caseId)) {
      setStatus({
        type: "error",
        message:
          "Enter a valid Case ID in the format STORY- followed by 15 letters or numbers.",
      });
      return;
    }

    setSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      await postJson("/removal-request", payload);
      setForm(initialForm);
      setStatus({
        type: "success",
        message:
          "Your removal request was submitted successfully. We will review it and contact you by email.",
      });
    } catch (requestError) {
      setStatus({ type: "error", message: requestError.message });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "mt-2 w-full rounded-lg border border-[#cbd5ce] bg-white px-4 py-3 text-base outline-none transition focus:border-[#075b36] focus:ring-2 focus:ring-[#075b36]/15";

  return (
    <main className="min-h-screen bg-[#f7f8f6] text-[#253b32]">
      <DocumentPageHeader
        title="Story Correction and Removal Request"
        description="Request review and removal of a previously submitted HOA story."
        maxWidthClass="max-w-[860px]"
        titleSizeClass="text-[32px] sm:text-[40px]"
      />

      <section className="px-5 pb-14 pt-7 md:px-8">
        <div className="mx-auto max-w-[860px]">
          <div className="mb-6 flex gap-3 rounded-lg border border-[#ead7a3] bg-[#fff9e8] p-4 text-sm leading-6 text-[#674d12]">
            <FiAlertTriangle className="mt-1 shrink-0 text-xl" />
            <p>
              Use the Case ID received with your story confirmation. The email
              address must match the email used when the story was submitted.
            </p>
          </div>

          {status.message && (
            <div
              role="alert"
              className={`mb-6 flex items-start gap-3 rounded-lg border px-4 py-3 font-semibold ${
                status.type === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {status.type === "success" ? (
                <FiCheckCircle className="mt-0.5 shrink-0 text-xl" />
              ) : (
                <FiAlertTriangle className="mt-0.5 shrink-0 text-xl" />
              )}
              <p>{status.message}</p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-xl bg-white p-5 shadow-sm sm:p-8"
          >
            <label className="block font-bold text-[#163c2b]">
              Case ID
              <input
                name="caseId"
                value={form.caseId}
                onChange={(event) =>
                  updateField("caseId", event.target.value.toUpperCase())
                }
                required
                maxLength={21}
                pattern="STORY-[A-Za-z0-9]{15}"
                placeholder="STORY-XXXXXXXXXXXXXXX"
                autoComplete="off"
                className={`${inputClass} font-mono uppercase tracking-wide`}
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block font-bold text-[#163c2b]">
                Name
                <input
                  name="name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  required
                  autoComplete="name"
                  className={inputClass}
                />
              </label>

              <label className="block font-bold text-[#163c2b]">
                Email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  required
                  autoComplete="email"
                  placeholder="Use the email from your story"
                  className={inputClass}
                />
              </label>
            </div>

            <label className="block font-bold text-[#163c2b]">
              Removal Reason
              <textarea
                name="reason"
                value={form.reason}
                onChange={(event) => updateField("reason", event.target.value)}
                required
                rows={7}
                placeholder="Explain why you are requesting removal of this story."
                className={`${inputClass} resize-y`}
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#075b36] px-6 py-3.5 font-bold text-white transition hover:bg-[#06472b] disabled:cursor-wait disabled:opacity-60 sm:w-auto"
            >
              <FiSend />
              {isSubmitting ? "Submitting..." : "Submit Removal Request"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default RemovalRequest;
