import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FiCheck,
  FiLock,
  FiMail,
  FiShield,
  FiUser,
  FiX,
} from "react-icons/fi";
import newsletterArtwork from "../../assets/logo/newsletterLogo.png";
import { postJson } from "../../lib/api";

const SESSION_DISMISSED_KEY = "hoa_newsletter_popup_dismissed";
const SUBSCRIBED_KEY = "hoa_newsletter_subscribed";

function validateForm(values) {
  const errors = {};
  const firstName = values.firstName.trim();
  const email = values.email.trim();

  if (firstName.length > 100) {
    errors.firstName = "First name must not exceed 100 characters.";
  }
  if (!email) {
    errors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email address.";
  }
  if (!values.consent) {
    errors.consent = "Please agree to receive newsletters and updates.";
  }

  return errors;
}

const ControlNotice = ({ className = "" }) => (
  <div
    className={`mx-auto flex w-full max-w-sm items-center gap-3 rounded-lg bg-white/75 p-3 text-left shadow-sm ring-1 ring-[#dce9df] ${className}`}
  >
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e6f2e9] text-xl text-[#006b3c]">
      <FiShield aria-hidden="true" />
    </span>
    <p className="text-sm text-[#52605a]">
      <strong className="block text-sm text-[#075c36]">
        You’re in control.
      </strong>
      You can unsubscribe from our newsletters at any time.
    </p>
  </div>
);

const NewsletterPopup = ({ standalone = false }) => {
  const { pathname } = useLocation();
  const [isOpen, setOpen] = useState(false);
  const [values, setValues] = useState({
    firstName: "",
    email: "",
    consent: false,
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (standalone) return undefined;
    if (/^\/newsletters?\/unsubscribe\//.test(pathname)) return undefined;
    if (/^\/newsletters?\/subscribe\/?$/.test(pathname)) return undefined;

    const normalizedPathname = pathname.replace(/\/+$/, "") || "/";
    const isNewsletterPage = ["/newsletter", "/newsletter/subscribe"].includes(
      normalizedPathname,
    );
    if (!isNewsletterPage) {
      if (window.localStorage.getItem(SUBSCRIBED_KEY) === "true") {
        return undefined;
      }
      if (window.sessionStorage.getItem(SESSION_DISMISSED_KEY) === "true") {
        return undefined;
      }
    }

    const timer = window.setTimeout(
      () => setOpen(true),
      isNewsletterPage ? 0 : 1200,
    );
    return () => window.clearTimeout(timer);
  }, [pathname, standalone]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        window.sessionStorage.setItem(SESSION_DISMISSED_KEY, "true");
        setOpen(false);
      }
    };
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const closePopup = () => {
    window.sessionStorage.setItem(SESSION_DISMISSED_KEY, "true");
    setOpen(false);
  };

  const updateValue = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) =>
      current[field] ? { ...current, [field]: "" } : current,
    );
    setApiError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateForm(values);
    setErrors(nextErrors);
    setApiError("");

    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const payload = {
        email: values.email.trim().toLowerCase(),
        consent: true,
      };
      const firstName = values.firstName.trim();
      if (firstName) payload.firstName = firstName;

      const response = await postJson("/newsletters/subscribe", payload);
      window.localStorage.setItem(SUBSCRIBED_KEY, "true");
      window.sessionStorage.setItem(SESSION_DISMISSED_KEY, "true");
      setOpen(false);

      await Swal.fire({
        icon: "success",
        title: "Subscription confirmed",
        text:
          response?.message ||
          "Thank you for subscribing to the HOA Nightmares newsletter.",
        confirmButtonText: "Done",
        confirmButtonColor: "#006b3c",
      });
    } catch (error) {
      setApiError(
        error.message ||
          "We could not complete your subscription. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!standalone && !isOpen) return null;

  return (
    <div
      className={
        standalone
          ? "flex min-h-[calc(100vh-92px)] items-center justify-center bg-[#eef2ef] px-3 py-5 sm:px-5"
          : "fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-6"
      }
      role={standalone ? undefined : "presentation"}
      onMouseDown={(event) => {
        if (!standalone && event.target === event.currentTarget) closePopup();
      }}
    >
      <section
        role={standalone ? "main" : "dialog"}
        aria-modal={standalone ? undefined : "true"}
        aria-labelledby="newsletter-popup-title"
        className={`relative my-auto grid w-full max-w-4xl overflow-hidden rounded-[20px] bg-white shadow-2xl md:grid-cols-[0.92fr_1.08fr] ${
          standalone
            ? ""
            : "max-h-[calc(100vh-1.5rem)] overflow-y-auto md:max-h-[min(850px,calc(100vh-3rem))] md:overflow-hidden"
        }`}
      >
        {!standalone && (
          <button
            type="button"
            onClick={closePopup}
            aria-label="Close newsletter signup"
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl text-[#27313a] shadow-lg transition hover:scale-105 hover:bg-[#f3f5f4]"
          >
            <FiX aria-hidden="true" />
          </button>
        )}

        <div className="bg-[linear-gradient(160deg,#f8fcf9_0%,#f0f7f2_100%)] px-5 pb-5 pt-6 text-center sm:px-7 md:flex md:min-h-[560px] md:flex-col md:justify-between md:px-8 md:py-7">
          <div>
            <img
              src={newsletterArtwork}
              alt="Stay informed. Stay empowered."
              className="mx-auto h-auto w-full max-w-[320px] object-contain"
            />
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#303941] md:text-base">
              Subscribe to HOA Nightmares and get the latest homeowner stories,
              legal insights, and resources delivered straight to your inbox.
            </p>
          </div>

          <ControlNotice className="mt-4 hidden md:flex" />
        </div>

        <div className="flex flex-col justify-center px-5 pb-6 pt-5 sm:px-7 md:px-8 md:py-7">
          <div className="hidden text-center md:block">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#edf5ef] text-3xl text-[#006b3c]">
              <FiMail aria-hidden="true" />
            </span>
            <h2
              id="newsletter-popup-title"
              className="mt-3 font-serif text-3xl text-[#151b21] md:text-4xl"
            >
              Join Our Newsletter
            </h2>
            <span className="mx-auto mt-3 block h-0.5 w-28 bg-[linear-gradient(90deg,#006b3c_0_50%,#c8102e_50%)]" />
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#303941] md:text-base">
              Be the first to know about new stories, legal updates, and
              important resources.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4 md:mt-5">
            <div>
              <label htmlFor="newsletter_first_name" className="text-sm font-bold">
                First Name <span className="font-normal text-[#6b747b]">(optional)</span>
              </label>
              <div
                className={`mt-1.5 flex items-center rounded-lg border bg-white px-3 ${
                  errors.firstName ? "border-[#c8102e]" : "border-[#cbd2d6]"
                }`}
              >
                <FiUser className="shrink-0 text-xl text-[#929aa0]" />
                <input
                  id="newsletter_first_name"
                  value={values.firstName}
                  onChange={(event) =>
                    updateValue("firstName", event.target.value)
                  }
                  maxLength={100}
                  autoComplete="given-name"
                  placeholder="Enter your first name"
                  className="w-full bg-transparent px-3 py-3 text-sm outline-none"
                />
              </div>
              {errors.firstName && (
                <p className="mt-1 text-sm font-semibold text-[#b42318]">
                  {errors.firstName}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="newsletter_email" className="text-sm font-bold">
                Email Address
              </label>
              <div
                className={`mt-1.5 flex items-center rounded-lg border bg-white px-3 ${
                  errors.email ? "border-[#c8102e]" : "border-[#cbd2d6]"
                }`}
              >
                <FiMail className="shrink-0 text-xl text-[#929aa0]" />
                <input
                  id="newsletter_email"
                  type="email"
                  value={values.email}
                  onChange={(event) => updateValue("email", event.target.value)}
                  required
                  autoComplete="email"
                  placeholder="Enter your email address"
                  className="w-full bg-transparent px-3 py-3 text-sm outline-none"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm font-semibold text-[#b42318]">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="newsletter_consent"
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${
                  errors.consent
                    ? "border-[#c8102e] bg-red-50"
                    : "border-transparent bg-[#f1f6f2]"
                }`}
              >
                <span className="relative mt-0.5 h-5 w-5 shrink-0">
                  <input
                    id="newsletter_consent"
                    type="checkbox"
                    checked={values.consent}
                    onChange={(event) =>
                      updateValue("consent", event.target.checked)
                    }
                    className="peer h-5 w-5 appearance-none rounded border-2 border-[#087044] bg-white checked:bg-[#087044]"
                  />
                  <FiCheck className="pointer-events-none absolute left-0.5 top-0.5 hidden text-white peer-checked:block" />
                </span>
                <span className="leading-6">
                  I agree to receive{" "}
                  <strong className="text-[#075c36]">HOA Nightmares</strong>{" "}
                  newsletters and updates.
                </span>
              </label>
              {errors.consent && (
                <p className="mt-1 text-sm font-semibold text-[#b42318]">
                  {errors.consent}
                </p>
              )}
            </div>

            {apiError && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {apiError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#006b3c] px-4 py-3 text-base font-bold text-white shadow-md transition hover:bg-[#004f2d] disabled:cursor-wait disabled:opacity-65"
            >
              {isSubmitting ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <FiMail className="text-xl" aria-hidden="true" />
              )}
              {isSubmitting ? "Subscribing..." : "Subscribe Now"}
            </button>

            <p className="flex items-center justify-center gap-2 text-center text-xs text-[#778087] sm:text-sm">
              <FiLock aria-hidden="true" />
              We respect your privacy. Your information is safe with us.
            </p>
          </form>

          <ControlNotice className="mt-5 md:hidden" />
        </div>
      </section>
    </div>
  );
};

export default NewsletterPopup;
