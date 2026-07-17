import React from "react";

const PageLoadingSpinner = ({ label = "Loading...", className = "" }) => (
  <div
    role="status"
    aria-live="polite"
    aria-busy="true"
    className={`flex min-h-64 flex-col items-center justify-center gap-3 text-center font-semibold text-[#0a4d2c] ${className}`}
  >
    <span
      aria-hidden="true"
      className="h-11 w-11 animate-spin rounded-full border-4 border-[#bfd0c5] border-t-[#0a6b3b]"
    />
    <span>{label}</span>
  </div>
);

export default PageLoadingSpinner;
