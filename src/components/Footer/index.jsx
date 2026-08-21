import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { AiOutlineCopyright } from "react-icons/ai";
import { FaHome, FaYoutube } from "react-icons/fa";
import { FaSquareXTwitter } from "react-icons/fa6";
import { ImFacebook2 } from "react-icons/im";
import logo from "../../assets/images/footerImage.png";
import newsletterLogo from "../../assets/logo/newsletter.webp";
import { getConfiguredUrl } from "../../lib/siteSettings";

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

const Footer = ({ settings }) => {
  const contactInfo = settings?.contactInfo || {};
  const footerLinks = useMemo(
    () =>
      (settings?.footer?.links || []).filter(
        (item) => item?.label && (item?.url || item?.href),
      ),
    [settings?.footer?.links],
  );
  const addressLines = useMemo(
    () =>
      String(
        contactInfo.address ||
          "P.O. Box 732024\nOrmond Beach, Florida 32173-2024",
      )
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    [contactInfo.address],
  );
  const email = contactInfo.email || "info@hoanightmares.org";
  const logoSrc = logo;
  const footerText = "hoanightmares.org";
  const linkSplitIndex = Math.ceil(footerLinks.length / 2);
  const footerLinkColumns = [
    footerLinks.slice(0, linkSplitIndex),
    footerLinks.slice(linkSplitIndex),
  ];
  const getSocialHref = (platform, fallback) =>
    getConfiguredUrl(settings?.socialLinks, platform, fallback);

  return (
    <>
      <footer className="border-y-2 bg-[#e8ebec] px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.15fr_0.9fr_0.9fr_1.1fr]">
            <div className="space-y-1 text-[17px]">
              <h4 className="text-gray-800">Mailing Address:</h4>
              <div className="leading-5">
                {addressLines.map((line) => (
                  <p key={line} className="text-gray-700 font-bold">
                    {line}
                  </p>
                ))}
              </div>
              <div className="space-y-1 mt-4">
                <h4 className="text-gray-800">E-Mail:</h4>
                <p className="text-gray-700 font-bold">{email}</p>
              </div>
            </div>

            {footerLinkColumns.map((column, columnIndex) => (
              <ul
                key={`footer-links-${columnIndex}`}
                className="space-y-1 text-[14px] text-gray-700"
              >
                {column.map((item) => (
                  <li key={`${item.label}-${item.url || item.href}`}>
                    <SmartLink item={item} className="hover:text-green-700">
                      &#9650; {item.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            ))}

            <div className="flex flex-col items-center gap-5">
              <div
                className="flex flex-wrap items-center justify-center gap-3"
                aria-label="Social media links"
              >
                <a
                  href={getSocialHref("newsletters", "/newsletters/subscribe")}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Newsletter"
                  className="transition-opacity hover:opacity-75"
                >
                  <img
                    src={newsletterLogo}
                    alt=""
                    className="h-9 w-9 rounded-lg object-contain"
                  />
                </a>
                <a
                  href={getSocialHref("facebook", "https://facebook.com")}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="transition-opacity hover:opacity-75"
                >
                  <ImFacebook2 size={30} color="#1877F2" />
                </a>
                <a
                  href={getSocialHref("twitter", "https://x.com")}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="X / Twitter"
                  className="transition-opacity hover:opacity-75"
                >
                  <FaSquareXTwitter size={31} color="#000" />
                </a>
                <a
                  href={getSocialHref("nextdoor", "https://nextdoor.com")}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Nextdoor"
                  className="flex items-center gap-1 rounded-[3px] bg-[#00b246] px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#009c3e]"
                >
                  <FaHome size={14} />
                  Nextdoor
                </a>
                <a
                  href={getSocialHref("youtube", "https://youtube.com")}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                  className="transition-opacity hover:opacity-75"
                >
                  <FaYoutube size={34} color="#FF0000" />
                </a>
              </div>

              <img
                src={logoSrc}
                alt="HOA Nightmares"
                className="h-auto w-full max-w-[200px] object-contain"
              />
            </div>
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
