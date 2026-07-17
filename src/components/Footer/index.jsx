import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AiOutlineCopyright } from "react-icons/ai";
import logo from "../../assets/images/footerImage.png";
import { getSiteSettings } from "../../lib/siteSettings";

const DEFAULT_FOOTER_LINKS = [
  { label: "Non-Legal Homeowner Advocate", url: "/non-legal-advocate" },
  // { label: "Homeowner Attorneys", url: "/attorneys/find-homeowner-attorney" },
  { label: "HOA Horror Stories", url: "/hoa-horror-stories" },
  // { label: "Submit Your Story", url: "/submit-your-story" },
  { label: "Resources", url: "/resources" },
  { label: "Blog", url: "/blog" },
  { label: "FAQ", url: "/frequently-asked-questions" },
  // { label: "About Us", url: "/about" },
  // { label: "Contact Us", url: "/contact" },
];

const POLICY_LINKS = [
  { label: "Privacy Policy", url: "/privacy-policy" },
  { label: "Terms of Use", url: "/terms-of-use" },
  { label: "Legal Disclaimer", url: "/legal-disclaimer" },
  // { label: "Non-Legal Advocate Disclosure", url: "/non-legal-advocate" },
  // { label: "Contact", url: "/contact" },
  // { label: "Submit Story", url: "/submit-your-story" },
  { label: "Attorney Disclaimer", url: "/attorney-disclaimer" },
];

function mergeFooterLinks(configuredLinks = []) {
  const linksByUrl = new Map();

  DEFAULT_FOOTER_LINKS.forEach((item) => {
    linksByUrl.set(item.url, item);
  });

  configuredLinks.forEach((item) => {
    const url = item?.url || item?.href;
    const label = item?.label;
    if (!url || !label || linksByUrl.has(url)) return;
    linksByUrl.set(url, { label, url });
  });

  return Array.from(linksByUrl.values());
}

function SmartLink({ item, className, children }) {
  const href = item.url || item.href || "/";

  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} className={className} target="_blank" rel="noreferrer">
        {children || item.label}
      </a>
    );
  }

  return (
    <Link to={href} className={className}>
      {children || item.label}
    </Link>
  );
}

const Footer = () => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    getSiteSettings({ signal: controller.signal })
      .then(setSettings)
      .catch(() => {});

    return () => controller.abort();
  }, []);

  const contactInfo = settings?.contactInfo || {};
  const footerLinks = useMemo(
    () => mergeFooterLinks(settings?.footer?.links),
    [settings?.footer?.links],
  );
  const addressLines = useMemo(
    () =>
      String(
        contactInfo.address || "P.O. Box 732024\nOrmond Beach, Florida 32173-2024",
      )
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    [contactInfo.address],
  );
  const email = contactInfo.email || "info@hoanightmares.org";
  const logoSrc = settings?.logoUrl || logo;
  const footerText = settings?.footer?.text || "HOA Nightmares.org";

  return (
    <>
      <footer className="bg-gray-100 py-4 px-4 border-2 border-l-0 border-r-0 border-b-2">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-1">
              <h4 className="text-gray-800">Mailing Address:</h4>
              <div className="leading-5">
                {addressLines.map((line) => (
                  <p key={line} className="text-md text-gray-700 font-bold">
                    {line}
                  </p>
                ))}
              </div>
              <div className="space-y-1 mt-4">
                <h4 className="text-gray-800">E-Mail:</h4>
                <p className="text-md text-gray-700 font-bold">{email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <ul className="space-y-1 text-lg text-gray-700">
                {footerLinks.map((item) => (
                  <li key={`${item.label}-${item.url || item.href}`}>
                    <SmartLink item={item} className="hover:text-green-700">
                      &#9650; {item.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col items-center justify-center space-y-2">
              <img src={logoSrc} alt="HOA Nightmares" height={200} width={300} />
            </div>
          </div>

          <div className="mt-6 border-t border-gray-300 pt-4 flex flex-wrap gap-4 text-sm text-gray-600">
            {POLICY_LINKS.map((item) => (
              <SmartLink
                key={item.url}
                item={item}
                className="hover:text-green-700"
              />
            ))}
          </div>
        </div>
      </footer>
      <div className="flex justify-center gap-5 font-bold p-2 md:p-4">
        <span>{footerText}</span>
        <span className="flex gap-1">
          Copyright <AiOutlineCopyright size={20} /> {new Date().getFullYear()}
        </span>
        <span>All Rights Reserved</span>
      </div>
    </>
  );
};

export default Footer;