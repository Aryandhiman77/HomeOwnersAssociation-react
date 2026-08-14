import { useState, useRef, useEffect } from "react";
import { FaBars, FaTimes, FaHome, FaYoutube } from "react-icons/fa";
import { FaSquareXTwitter } from "react-icons/fa6";
import { ImFacebook2 } from "react-icons/im";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import { Link, useLocation } from "react-router-dom";

import logo_1 from "../../assets/logo/logo-1.png";
import logo_2 from "../../assets/logo/logo-2.png";
import newsletterLogo from "../../assets/logo/newsletter.webp";
import { getConfiguredUrl } from "../../lib/siteSettings";

/* ─── Full nav from site map ─── */
const NAV_ITEMS = [
  { label: "Home", href: "/" },
  {
    label: "Non Legal Homeowner Advocate",
    href: "/non-legal-advocate",
    dropdown: [
      { label: "Overview", href: "/non-legal-advocate" },
      { label: "Intake Form", href: "/non-legal-advocate/intake-form" },
      { label: "Legal Disclaimer", href: "/legal-disclaimer" },
      { label: "How It Works", href: "/non-legal-advocate/how-it-works" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    label: "Homeowner Attorneys",
    href: "/find-attorney",
    dropdown: [
      { label: "Select Your State", href: "/find-attorney" },
      { label: "Florida Attorneys", href: "/find-attorney?state=FL" },
      { label: "Other States", href: "/find-attorney?state=other" },
      { label: "Attorney Submission Form", href: "/find-attorney/submit" },
    ],
  },
  {
    label: "About Us",
    href: "/about-us",
    dropdown: [
      { label: "Our Story", href: "/about-us" },
      { label: "Mission", href: "/about-us#mission" },
      { label: "Disclaimer", href: "/about-us#disclaimer" },
    ],
  },
  {
    label: "Contact",
    href: "/contact",
    // dropdown: [
    //   { label: "General Contact",  href: "/contact" },
    //   { label: "Media Inquiries",  href: "/contact?type=media" },
    //   { label: "Submit Tips",      href: "/contact?type=tips" },
    // ],
  },
  { label: "Newsletter", href: "/newsletter" },
  { label: "Blog", href: "/blogs" },
  {
    label: "FAQs",
    href: "/frequenty-asked-questions",
  },
];

function getNavHref(item) {
  return item?.href || item?.url || "/";
}

const Header = ({ settings }) => {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const headerRef = useRef(null);

  /* close desktop dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navItems = settings?.navigationLabels?.length
    ? settings.navigationLabels
    : NAV_ITEMS;
  const contactEmail = settings?.contactInfo?.email || "info@hoanightmares.org";
  const getSocialHref = (platform, fallback) =>
    getConfiguredUrl(settings?.socialLinks, platform, fallback);

  const isActive = (item) =>
    pathname === getNavHref(item) ||
    item.dropdown?.some((d) => pathname === getNavHref(d));

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 w-full bg-white"
      style={{
        boxShadow:
          "inset 0 8px 8px rgba(60,60,60,.7), inset 0 -8px 8px rgba(60,60,60,.7)",
      }}
    >
      <div className="mx-auto max-w-[1320px] px-3 sm:px-5">
        {/* ── SINGLE ROW: logo-mark | email + wordmark | nav | social ── */}
        <div className="flex min-h-[82px] items-center justify-between gap-3 py-2 lg:min-h-[92px]">
          {/* LEFT — logo-1 + (email on top / logo-2 on bottom) */}
          <Link to={"/"} className="flex min-w-0 shrink items-center gap-0">
            {/* logo-1: the HOA circular badge */}
            <img
              src={settings?.logoUrl || logo_1}
              alt="HOA Nightmares logo mark"
              className="h-[56px] w-auto shrink-0 object-contain sm:h-[62px]"
            />

            {/* email + wordmark stacked */}
            <div className="ml-1 flex min-w-0 flex-col justify-center leading-none">
              <span className="hidden max-w-[190px] truncate pl-0.5 text-[11px] font-light tracking-wide text-gray-600 sm:block lg:max-w-[240px]">
                {contactEmail}
              </span>
              <img
                src={logo_2}
                alt="Nightmares.org wordmark"
                className="h-[28px] w-auto max-w-[185px] object-contain object-left sm:h-[34px] sm:max-w-none"
              />
            </div>
          </Link>

          <div className="flex shrink-0 flex-col items-end gap-1">
            {/* FAR RIGHT — social icons (desktop) + mobile hamburger */}
            <div className="flex items-center gap-3 ml-4 shrink-0 justify-end">
              {/* social — hidden on small screens */}
              <div className="hidden items-center gap-2 xl:flex">
                <a
                  href={getSocialHref("newsletters", "/newsletter")}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Newsletter"
                  className="transition-opacity hover:opacity-75"
                >
                  <img
                    src={newsletterLogo}
                    alt=""
                    className="h-7 w-7 rounded-md object-contain"
                  />
                </a>
                <a
                  href={getSocialHref("facebook", "https://facebook.com")}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="transition-opacity hover:opacity-75"
                >
                  <ImFacebook2 size={22} color="#1877F2" />
                </a>
                <a
                  href={getSocialHref("twitter", "https://x.com")}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="X / Twitter"
                  className="transition-opacity hover:opacity-75"
                >
                  <FaSquareXTwitter size={23} color="#000" />
                </a>
                <a
                  href={getSocialHref("nextdoor", "https://nextdoor.com")}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Nextdoor"
                  className="bg-[#00b246] hover:bg-[#009c3e] text-white text-[11px] font-semibold
                            px-2 py-[4px] flex items-center gap-1 rounded-[3px] transition-colors"
                >
                  <FaHome size={11} />
                  Nextdoor
                </a>
                <a
                  href={getSocialHref("youtube", "https://youtube.com")}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                  className="transition-opacity hover:opacity-75"
                >
                  <FaYoutube size={24} color="#FF0000" />
                </a>
              </div>

              {/* hamburger — mobile only */}
              <button
                type="button"
                onClick={() => {
                  setMobileOpen((o) => !o);
                  setMobileExpanded(null);
                }}
                className="p-2 text-gray-700 transition-colors hover:text-[#1a5c2a] xl:hidden"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                {mobileOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
              </button>
            </div>
            {/* CENTER-RIGHT — desktop nav */}
            <nav
              className="hidden flex-wrap items-center justify-end gap-y-1 xl:flex"
              aria-label="Main navigation"
            >
              {navItems.map((item) => {
                const active = isActive(item);
                const hasDropdown = item.dropdown?.length > 0;
                const isOpen = activeDropdown === item.label;

                return (
                  <div key={item.label} className="relative">
                    {/* nav link / button */}
                    {hasDropdown ? (
                      <button
                        type="button"
                        onMouseEnter={() => setActiveDropdown(item.label)}
                        onMouseLeave={() => setActiveDropdown(null)}
                        onClick={() =>
                          setActiveDropdown(isOpen ? null : item.label)
                        }
                        className={`flex items-center gap-[2px] px-2 py-[6px] text-[15px] 2xl:px-[10px] whitespace-nowrap cursor-pointer select-none transition-colors
                          ${active ? "text-[#1a5c2a] font-semibold" : "text-gray-800 hover:text-[#1a5c2a]"}`}
                      >
                        {item.label}
                        <MdKeyboardArrowDown
                          size={16}
                          className={`mt-[1px] transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                    ) : (
                      <Link
                        to={getNavHref(item)}
                        className={`block px-2 py-[6px] text-[15px] 2xl:px-[10px] whitespace-nowrap transition-colors
                          ${active ? "text-[#1a5c2a] font-semibold" : "text-gray-800 hover:text-[#1a5c2a]"}`}
                      >
                        {item.label}
                      </Link>
                    )}

                    {/* dropdown panel */}
                    {hasDropdown && (
                      <div
                        onMouseEnter={() => setActiveDropdown(item.label)}
                        onMouseLeave={() => setActiveDropdown(null)}
                        className={`absolute left-0 top-full min-w-[190px] z-50
                          bg-white border border-gray-200 shadow-lg rounded-sm
                          transition-all duration-150 origin-top
                          ${
                            isOpen
                              ? "opacity-100 scale-y-100 pointer-events-auto"
                              : "opacity-0 scale-y-95 pointer-events-none"
                          }`}
                        style={{ transformOrigin: "top center" }}
                      >
                        {item.dropdown.map((d) => (
                          <Link
                            key={getNavHref(d)}
                            to={getNavHref(d)}
                            onClick={() => setActiveDropdown(null)}
                            className={`block px-4 py-[8px] text-[13px] border-b border-gray-100 last:border-0
                              transition-colors hover:bg-[#f2f2ee] hover:text-[#1a5c2a]
                              ${pathname === getNavHref(d) ? "text-[#1a5c2a] font-semibold bg-[#f2f2ee]" : "text-gray-700"}`}
                          >
                            {d.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* ── MOBILE DROPDOWN MENU ── */}
      <div
        className={`overflow-hidden border-t border-gray-200 bg-white shadow-lg transition-all duration-300 xl:hidden ${
          mobileOpen ? "max-h-[85vh] overflow-y-auto" : "max-h-0"
        }`}
      >
        <nav className="px-2 py-2" aria-label="Mobile navigation">
          {navItems.map((item) => {
            const active = isActive(item);
            const hasDropdown = item.dropdown?.length > 0;
            const isExpanded = mobileExpanded === item.label;

            return (
              <div
                key={item.label}
                className="border-b border-gray-100 last:border-0"
              >
                {hasDropdown ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setMobileExpanded(isExpanded ? null : item.label)
                      }
                      className={`w-full flex items-center justify-between px-4 py-3 text-[14px] font-medium text-left transition-colors
                        ${active ? "text-[#1a5c2a]" : "text-gray-800"}`}
                    >
                      {item.label}
                      {isExpanded ? (
                        <MdKeyboardArrowUp size={18} />
                      ) : (
                        <MdKeyboardArrowDown size={18} />
                      )}
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-200 ${isExpanded ? "max-h-96" : "max-h-0"}`}
                    >
                      {item.dropdown.map((d) => (
                        <Link
                          key={getNavHref(d)}
                          to={getNavHref(d)}
                          onClick={() => setMobileOpen(false)}
                          className={`block px-8 py-2.5 text-[13px] transition-colors hover:text-[#1a5c2a] hover:bg-[#f5f5f0]
                            ${pathname === getNavHref(d) ? "text-[#1a5c2a] font-semibold" : "text-gray-600"}`}
                        >
                          {d.label}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <Link
                    to={getNavHref(item)}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-4 py-3 text-[14px] font-medium transition-colors
                      ${active ? "text-[#1a5c2a]" : "text-gray-800 hover:text-[#1a5c2a]"}`}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            );
          })}

          {/* social icons inside mobile menu */}
          <div className="flex items-center gap-4 px-4 py-4 border-t border-gray-100">
            <a
              href={getSocialHref("newsletters", "/newsletter")}
              target="_blank"
              rel="noreferrer"
              aria-label="Newsletter"
            >
              <img
                src={newsletterLogo}
                alt=""
                className="h-7 w-7 rounded-md object-contain"
              />
            </a>
            <a
              href={getSocialHref("facebook", "https://facebook.com")}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
            >
              <ImFacebook2 size={22} color="#1877F2" />
            </a>
            <a
              href={getSocialHref("twitter", "https://x.com")}
              target="_blank"
              rel="noreferrer"
              aria-label="X"
            >
              <FaSquareXTwitter size={22} color="#000" />
            </a>
            <a
              href={getSocialHref("nextdoor", "https://nextdoor.com")}
              target="_blank"
              rel="noreferrer"
              className="bg-[#00b246] text-white text-[12px] font-semibold px-2 py-1 flex items-center gap-1 rounded-[3px]"
            >
              <FaHome size={12} /> Nextdoor
            </a>
            <a
              href={getSocialHref("youtube", "https://youtube.com")}
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
            >
              <FaYoutube size={24} color="#FF0000" />
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
