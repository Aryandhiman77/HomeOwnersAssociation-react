import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import imageLeft from "../../assets/images/nonLegalAdvocate.png";
import Button from "../../components/Elements/Button";
import { MdKeyboardArrowRight } from "react-icons/md";
import { GiMegaphone } from "react-icons/gi";
import { FaShieldAlt } from "react-icons/fa";
import { HiUsers } from "react-icons/hi";
import { IoIosLock } from "react-icons/io";
import "./style.css";
import { buildAssetUrl, getJson } from "../../lib/api";
import { getCmsButtonClass } from "../../lib/cmsButtonStyles";

const FALLBACK_CARDS = [
  {
    icon: <FaShieldAlt size={80} className="text-green-900 -translate-y-2" />,
    title: "HOME OWNERS COME FIRST.",
    description: "We advocate for fairness, transparency, and respect.",
  },
  {
    icon: (
      <GiMegaphone
        size={80}
        className="text-green-900 -rotate-20 -translate-y-2"
      />
    ),
    title: "NON LEGAL ADVICE.",
    description: "We are here to listen and not to practice law.",
  },
  {
    icon: <HiUsers size={80} className="text-green-900 -translate-y-2" />,
    title: "PRACTICAL PERSPECTIVE.",
    description: "Get clarity and confidence in your next steps.",
  },
  {
    icon: <IoIosLock size={80} className="text-green-900 -translate-y-2" />,
    title: "CONFIDENTIAL & RESPECTFUL.",
    description: "Your story stays private. Your voice matters.",
  },
];

const FALLBACK_BUTTONS = [
  {
    text: "REQUEST A REVIEW",
    link: "/non-legal-advocate/intake-form",
    style: "green-text-white",
  },
  {
    text: "LEARN MORE",
    link: "/non-legal-advocate/how-it-works",
    style: "green-bordered",
  },
];

function getImageUrl(image, fallback) {
  return image?.url ? buildAssetUrl(image.url) : fallback;
}

const Overview = () => {
  const navigate = useNavigate();
  const [cms, setCms] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    getJson("/non-legal-advocate-page-content", { signal: controller.signal })
      .then((response) => setCms(response?.data || response || null))
      .catch(() => {});

    return () => controller.abort();
  }, []);

  const buttons = cms?.buttons?.length ? cms.buttons : FALLBACK_BUTTONS;
  const cards = cms?.cards?.length
    ? cms.cards.map((card, index) => ({
        ...card,
        icon: FALLBACK_CARDS[index]?.icon,
      }))
    : FALLBACK_CARDS;
  // Keep the CMS image as its own layer. The responsive overlay is applied in
  // CSS so large screens can show the image without being darkened.
  const backgroundImageUrl = cms?.background_image?.url
    ? buildAssetUrl(cms.background_image.url)
    : null;

  const handleButtonClick = (link) => {
    if (!link) return;
    if (/^https?:\/\//i.test(link)) {
      window.location.assign(link);
      return;
    }
    navigate(link);
  };

  return (
    <div
      className="non-legal-overview"
      aria-label={cms?.background_image?.altText}
      role={backgroundImageUrl ? "img" : undefined}
      style={{
        backgroundImage: backgroundImageUrl
          ? `url("${backgroundImageUrl}")`
          : undefined,
        backgroundPosition: "center right",
      }}
    >
      <div className="non-legal-overview__content max-w-7xl mx-auto">
        <div className="my-15 sm:w-120 text-white lg:text-black p-2">
          <img
            src={getImageUrl(cms?.featured_image1, imageLeft)}
            alt={cms?.featured_image1?.altText || "Non-legal advocate"}
            className="w-full "
          />
          <div className="mt-4 uppercase text-2xl leading-7 font-semibold ">
            <p>{cms?.heroHeading || "A sounding board for Homeowners."}</p>
            <p>{cms?.subtitle || "Not Legal Advice."}</p>
          </div>
          <p className="mt-1">
            {cms?.description ||
              "Get a fresh perspective from someone who's on your side. Our non-legal advocate reviews your situation answers your questions, and helps you explore your options--without giving legal advice."}
          </p>
          <div className="flex flex-wrap items-center gap-5 py-5">
            {buttons.map((button) => (
              <Button
                key={`${button.text}-${button.link}`}
                title={button.text}
                endIcon={<MdKeyboardArrowRight size={23} />}
                onClick={() => handleButtonClick(button.link)}
                className={getCmsButtonClass(
                  button.style,
                  "rounded-md font-medium text-sm",
                  "green-text-white",
                )}
              />
            ))}
          </div>
        </div>
        <div className="border-2 border-[#eeeeee] max-w-7xl mx-auto mb-0 lg:mb-10 lg:rounded-3xl bg-[#f9f9f7] lg:-translate-y-10">
          <div className="grid lg:grid-cols-4 p-4 py-7 gap-4 grid-cols-1 sm:grid-cols-2">
            {cards.map((card, index) => (
              <div
                key={`${card.title}-${index}`}
                className={`flex flex-row gap-2 sm:px-2 ${index < cards.length - 1 ? "sm:border-r-2 border-[#eeeeee]" : ""}`}
              >
                {card.icon || (
                  <FaShieldAlt
                    size={80}
                    className="text-green-900 -translate-y-2"
                  />
                )}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold leading-5">
                    {card.title}
                  </h3>
                  <p className="text-sm">{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
