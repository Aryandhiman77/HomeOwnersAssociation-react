import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import image from "../assets/images/footerImage.png";
import { getJson, postJson } from "../lib/api";
import { addLocalQueueRecord } from "../lib/adminLocalQueues";

const fallbackDescription =
  "Feel free to contact us if you have any questions or comments below. You may also contact our Non-Legal Advocate regarding possible action you could take regarding your alleged Homeowner experience with your HOA in your community.";

const ContactUs = () => {
  const [status, setStatus] = useState({ type: "", message: "" });
  const [contactCms, setContactCms] = useState(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const privacyNotice =
    contactCms?.privacyText ||
    "Our information will be processed as detailed in our Privacy Policy";
  const privacyPolicyIndex = privacyNotice
    .toLowerCase()
    .indexOf("privacy policy");
  const statusClass = useMemo(() => {
    if (status.type === "success") {
      return "border-green-200 bg-green-50 text-green-800";
    }

    return "border-red-200 bg-red-50 text-red-700";
  }, [status.type]);

  useEffect(() => {
    const controller = new AbortController();

    getJson("/contact-page-content", { signal: controller.signal })
      .then((response) => setContactCms(response?.data || response || null))
      .catch(() => {});

    return () => controller.abort();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    const form = event.currentTarget;
    const formData = new FormData(form);
    const honeypot = String(formData.get("company_website") || "").trim();
    const message = String(formData.get("contact_message") || "").trim();

    if (honeypot) {
      setStatus({
        type: "error",
        message: "Submission could not be completed.",
      });
      return;
    }

    if (message.length < 20) {
      setStatus({
        type: "error",
        message: "Message must be at least 20 characters.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        contact_name: String(formData.get("contact_name") || "").trim(),
        contact_email: String(formData.get("contact_email") || "").trim(),
        contact_subject: String(formData.get("contact_subject") || "").trim(),
        contact_message: message,
      };

      await postJson("/api/public/contact-form", payload);
      addLocalQueueRecord("contact", {
        ...payload,
        status: "new",
        created_at: new Date().toISOString(),
      });

      form.reset();
      setStatus({
        type: "success",
        message: "Thank you. Your message has been submitted.",
      });
    } catch (error) {
      let errorMessage = error.message;

      if (errorMessage.includes("next is not a function")) {
        errorMessage =
          "Contact form temporarily unavailable. Please email info@hoanightmares.org.";
      }

      setStatus({
        type: "error",
        message: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-white px-4 py-9 md:py-12">
      <section className="mx-auto w-full max-w-[864px] border border-black bg-white px-7 py-8 md:px-9">
        <img src={image} alt="HOA Nightmares" className="h-14 w-auto" />
        <h1 className="mt-3 text-2xl font-bold leading-tight text-black md:text-3xl">
          {contactCms?.heading || "Contact Us Privately"}
        </h1>
        <p className="mt-3 text-sm font-semibold text-black">
          {contactCms?.subHeading || "Private - Non-Legal - Informational"}
        </p>
        <p className="mt-4 max-w-[790px] text-[15px] font-medium leading-7 text-black">
          {contactCms?.description || fallbackDescription}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 text-[15px] font-medium text-black">
          <input
            type="text"
            name="company_website"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />

          <label htmlFor="contact_name" className="block">
            Name
          </label>
          <input
            type="text"
            id="contact_name"
            name="contact_name"
            required
            minLength={2}
            maxLength={100}
            className="mt-1 block h-9 w-full max-w-[474px] border border-[#506070] px-2 outline-none"
          />

          <label htmlFor="contact_subject" className="mt-5 block">
            Your Community Name, or HOA Name
          </label>
          <input
            type="text"
            id="contact_subject"
            name="contact_subject"
            required
            className="mt-1 block h-9 w-full max-w-[474px] border border-[#506070] px-2 outline-none"
          />

          <label htmlFor="contact_email" className="mt-5 block">
            Your E-Mail Address
          </label>
          <input
            type="email"
            id="contact_email"
            name="contact_email"
            required
            className="mt-1 block h-9 w-full max-w-[474px] border border-[#506070] px-2 outline-none"
          />

          <label htmlFor="contact_message" className="mt-1 block">
            Your Message
          </label>
          <textarea
            id="contact_message"
            name="contact_message"
            required
            minLength={20}
            className="block h-[260px] w-full resize-y border border-[#506070] p-2 outline-none md:h-[262px]"
          />

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-medium text-black">
              {privacyPolicyIndex >= 0 ? (
                <>
                  {privacyNotice.slice(0, privacyPolicyIndex)}
                  <Link
                    to="/privacy-policy"
                    className="font-bold text-[#006b38] underline decoration-1 underline-offset-2 hover:text-black"
                  >
                    {privacyNotice.slice(
                      privacyPolicyIndex,
                      privacyPolicyIndex + "privacy policy".length,
                    )}
                  </Link>
                  {privacyNotice.slice(
                    privacyPolicyIndex + "privacy policy".length,
                  )}
                </>
              ) : (
                <>
                  {privacyNotice}{" "}
                  <Link
                    to="/privacy-policy"
                    className="font-bold text-[#006b38] underline decoration-1 underline-offset-2 hover:text-black"
                  >
                    Privacy Policy
                  </Link>
                </>
              )}
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-[#00733a] px-8 py-2 text-base font-bold uppercase tracking-wide text-white disabled:opacity-60 md:w-[105px]"
            >
              {isSubmitting ? "Sending" : "Send"}
            </button>
          </div>

          {status.message && (
            <p className={`mt-4 rounded-sm border px-4 py-3 font-semibold ${statusClass}`}>
              {status.message}
            </p>
          )}
        </form>
      </section>
    </main>
  );
};

export default ContactUs;
