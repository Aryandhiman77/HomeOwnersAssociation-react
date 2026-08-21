import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiAlertCircle, FiCheckCircle, FiMail } from "react-icons/fi";
import { postJson } from "../lib/api";

const NewsletterUnsubscribe = () => {
  const { token = "" } = useParams();
  const [state, setState] = useState({
    status: "loading",
    message: "We are processing your unsubscribe request.",
  });

  useEffect(() => {
    let isCurrent = true;

    async function unsubscribe() {
      if (!token.trim()) {
        if (isCurrent) setState({
          status: "error",
          message:
            "This unsubscribe link is incomplete. Please use the complete link from your newsletter email.",
        });
        return;
      }

      try {
        const response = await postJson(
          `/newsletters/unsubscribe/${encodeURIComponent(token)}`,
          {},
        );
        if (isCurrent) setState({
          status: "success",
          message:
            response?.message ||
            "You have been unsubscribed from the HOA Nightmares newsletter.",
        });
      } catch (error) {
        if (isCurrent) setState({
          status: "error",
          message:
            error.message ||
            "We could not process this unsubscribe request. Please try again later.",
        });
      }
    }

    unsubscribe();
    return () => {
      isCurrent = false;
    };
  }, [token]);

  const isLoading = state.status === "loading";
  const isSuccess = state.status === "success";

  return (
    <main className="flex min-h-[65vh] items-center bg-[#f7f8f6] px-4 py-12 text-[#273b32] md:px-8">
      <section className="mx-auto w-full max-w-2xl rounded-2xl border border-[#d8ddd5] bg-white p-7 text-center shadow-sm md:p-10">
        <span
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl ${
            isLoading
              ? "bg-[#edf2f4] text-[#60717c]"
              : isSuccess
                ? "bg-[#e6f4e9] text-[#087044]"
                : "bg-red-50 text-[#b42318]"
          }`}
        >
          {isLoading ? (
            <span className="h-9 w-9 animate-spin rounded-full border-4 border-[#ccd6dc] border-t-[#405b6d]" />
          ) : isSuccess ? (
            <FiCheckCircle />
          ) : (
            <FiAlertCircle />
          )}
        </span>
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.16em] text-[#c8102e]">
          Newsletter preferences
        </p>
        <h1 className="mt-3 text-3xl font-bold text-[#0a4d2c]">
          {isLoading
            ? "Processing your request"
            : isSuccess
              ? "Unsubscribe confirmed"
              : "Unable to unsubscribe"}
        </h1>
        <p role={isSuccess ? "status" : "alert"} className="mx-auto mt-4 max-w-lg leading-7 text-[#5f6d64]">
          {state.message}
        </p>
        {!isLoading && (
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="rounded-md bg-[#0a4d2c] px-5 py-3 font-bold text-white hover:bg-black"
            >
              Return to Home
            </Link>
            {!isSuccess && (
              <a
                href="mailto:info@hoanightmares.org"
                className="inline-flex items-center gap-2 rounded-md border border-[#0a4d2c] px-5 py-3 font-bold text-[#0a4d2c]"
              >
                <FiMail /> Contact Support
              </a>
            )}
          </div>
        )}
      </section>
    </main>
  );
};

export default NewsletterUnsubscribe;
