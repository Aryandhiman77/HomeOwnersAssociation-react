import React from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiHome } from "react-icons/fi";

const NotFound = () => {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-[#f8faf9] px-4 py-16 text-[#243b2f] sm:px-6">
      <div className="w-full max-w-2xl rounded-2xl border border-[#dfe7e2] bg-white px-6 py-12 text-center shadow-sm sm:px-12">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#c8102e]">
          Error 404
        </p>
        <h1 className="mt-3 text-4xl font-bold text-[#0a4d2c] sm:text-5xl">
          Page not found
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-[#66736c]">
          The page you’re looking for may have moved, been removed, or the
          address may be incorrect.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0a4d2c] px-6 py-3 font-semibold text-white transition hover:bg-[#073a21]"
          >
            <FiHome aria-hidden="true" />
            Return Home
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#b8c4bd] bg-white px-6 py-3 font-semibold text-[#0a4d2c] transition hover:bg-[#f0f4f1]"
          >
            <FiArrowLeft aria-hidden="true" />
            Go Back
          </button>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
