import React from "react";
import { Link } from "react-router-dom";

const ThankYou = () => {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h1 className="text-4xl font-bold text-[#0a4d2c]">Thank You</h1>
      <p className="mt-4 text-lg text-gray-700">
        Your submission has been received and saved for review.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex rounded-md bg-[#0a4d2c] px-6 py-2 text-white"
      >
        Return Home
      </Link>
    </main>
  );
};

export default ThankYou;
