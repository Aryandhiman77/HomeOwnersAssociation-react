import React from "react";
import { Link } from "react-router-dom";

const CmsPlaceholder = ({ title, description }) => {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 text-[#253b32]">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0a4d2c]">
        CMS Page
      </p>
      <h1 className="mt-3 text-4xl font-bold">{title}</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-gray-700">
        {description}
      </p>
      <div className="mt-8 rounded-lg border border-[#d8ded9] bg-[#f7faf8] p-6">
        <h2 className="text-2xl font-semibold">Phase 1 CMS Foundation</h2>
        <p className="mt-2 text-gray-700">
          This route is live and ready to be connected to CMS-managed records,
          publish statuses, filtering, SEO fields, and admin workflow controls.
        </p>
      </div>
      <Link
        to="/"
        className="mt-8 inline-flex rounded-md bg-[#0a4d2c] px-5 py-2 text-white"
      >
        Back to Home
      </Link>
    </main>
  );
};

export default CmsPlaceholder;
