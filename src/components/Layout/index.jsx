import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Footer from "../Footer";
import Header from "../Header";
import { getSiteSettings } from "../../lib/siteSettings";

const Layout = () => {
  const [siteSettings, setSiteSettings] = useState(null);
  const [isLoadingSiteSettings, setLoadingSiteSettings] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    getSiteSettings({ signal: controller.signal })
      .then(setSiteSettings)
      .catch((error) => {
        if (error.name !== "AbortError") {
          setSiteSettings(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingSiteSettings(false);
        }
      });

    return () => controller.abort();
  }, []);

  if (isLoadingSiteSettings) {
    return (
      <main
        role="status"
        aria-live="polite"
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-5 text-center text-[#273b32]"
      >
        <span
          aria-hidden="true"
          className="h-12 w-12 animate-spin rounded-full border-4 border-[#bfd0c5] border-t-[#0a6b3b]"
        />
        <div>
          <p className="text-xl font-bold text-[#0a4d2c]">Loading page...</p>
          <p className="mt-2 text-sm text-[#5f6d64]">
            Preparing the latest site content.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header settings={siteSettings} />
      <Outlet />
      <Footer settings={siteSettings} />
    </div>
  );
};

export default Layout;
