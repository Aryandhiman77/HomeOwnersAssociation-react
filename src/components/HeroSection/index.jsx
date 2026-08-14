import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import image1 from "../../assets/images/loveMyHome.png";
import Button from "../Elements/Button";
import image2 from "../../assets/images/property.png";
import Separator from "../Elements/Separator";
import { buildAssetUrl, getJson } from "../../lib/api";
import { getCmsButtonClass } from "../../lib/cmsButtonStyles";
import Swal from "sweetalert2";

const FALLBACK_BUTTONS = [
  {
    text: "Submit Your HOA Nightmare",
    link: "/submit-story",
    style: "red-text-white",
  },
  {
    text: "Browse Horror Stories",
    link: "/hoa-horror-stories",
    style: "red-bordered",
  },
];

function getButtonClass(button) {
  return getCmsButtonClass(button?.style, "rounded-lg font-semibold text-sm");
}

function getImageUrl(image, fallback) {
  return image?.url ? buildAssetUrl(image.url) : fallback;
}

const HeroSection = () => {
  const navigate = useNavigate();
  const [cms, setCms] = useState(null);
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
  const [showDisclaimerError, setShowDisclaimerError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    getJson("/home-page-content", { signal: controller.signal })
      .then((response) => setCms(response?.data || response || null))
      .catch(() => {});

    return () => controller.abort();
  }, []);

  const hero = cms?.hero || {};
  const highlight = cms?.highlight || {};
  const comparison = cms?.propertyComparison || {};
  const buttons = useMemo(
    () => (hero.buttons?.length ? hero.buttons : FALLBACK_BUTTONS),
    [hero.buttons],
  );

  const isSubmitStoryButton = (button) =>
    /submit(?:-your)?-story/i.test(button?.link || "") ||
    /submit.*(?:story|nightmare)/i.test(button?.text || "");

  const isBrowseStoriesButton = (button) =>
    /browse.*(?:horror|stories)/i.test(button?.text || "");

  const handleButtonClick = (button) => {
    const isSubmission = isSubmitStoryButton(button);
    const link = isBrowseStoriesButton(button)
      ? "/hoa-horror-stories"
      : button?.link || (isSubmission ? "/submit-story" : "");

    if (!link) return;

    if (isSubmission && !hasAcceptedDisclaimer) {
      setShowDisclaimerError(true);
      window.requestAnimationFrame(() => {
        document.getElementById("disclaimer")?.focus();
      });
      Swal.fire({
        icon: "warning",
        title: "Disclaimer Required",
        text: "Please check the disclaimer checkbox before proceeding to submit your story.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#0a5c36",
      });
      return;
    }

    if (/^https?:\/\//i.test(link)) {
      const url = new URL(link);

      if (url.origin === window.location.origin) {
        navigate(`${url.pathname}${url.search}${url.hash}`, {
          state: isSubmission
            ? { homepageDisclaimerAccepted: true }
            : undefined,
        });
        return;
      }

      window.location.assign(link);
      return;
    }

    navigate(link, {
      state: isSubmission ? { homepageDisclaimerAccepted: true } : undefined,
    });
  };

  return (
    <section className="bg-white py-5 px-4">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 ">
        <div className="space-y-6">
          <div className="space-y-2">
            <img
              src={getImageUrl(hero.featured_image1, image1)}
              alt={hero.featured_image1?.altText || "Love My Home"}
            />
            <p className="text-black text-md text-center font-semibold">
              {hero.subtitle ||
                "Order Your T-Shirt or Sweat Shirt for the Next Board Meeting."}
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            {buttons.map((button) => {
              return (
                <Button
                  key={`${button.text}-${button.link}`}
                  title={button.text}
                  onClick={() => handleButtonClick(button)}
                  className={getButtonClass(button)}
                />
              );
            })}
          </div>

          <div className="text-lg text-black space-y-1">
            <p
              className={`rounded-md border p-2 transition-colors ${
                showDisclaimerError
                  ? "border-red-600 bg-red-50 text-red-700"
                  : "border-transparent"
              }`}
            >
              <input
                type="checkbox"
                id="disclaimer"
                checked={hasAcceptedDisclaimer}
                aria-invalid={showDisclaimerError}
                onChange={(event) => {
                  const isChecked = event.target.checked;
                  setHasAcceptedDisclaimer(isChecked);
                  if (isChecked) setShowDisclaimerError(false);
                }}
                className={`mr-2 h-4 w-4 accent-[#0a5c36] ${
                  showDisclaimerError
                    ? "outline-2 outline-offset-2 outline-red-600"
                    : ""
                }`}
              />
              <label htmlFor="disclaimer">
                {hero.disclaimerCheckboxText ||
                  "I have read and agree to the Disclaimer and understand this submission is my opinion and responsibility. I confirm this submission is truthful to the best of my knowledge and does not intentionally contain false or defamatory statements."}
              </label>
            </p>
            <p className="font-normal mt-4 text-2xl">
              {hero.introText ||
                "A Platform focused on HOA neglect while collecting fees maintaining control yet, showing how one property can be maintained while another homeowner's property is ignored."}
            </p>
          </div>
          <Separator />
          <h2 className="text-xl md:text-3xl font-bold bg-black text-white p-2 px-5">
            {highlight.heading || "A Serious Platform for Homeowners."}
          </h2>
          <p className="font-semibold text-sm">
            {highlight.subHeading ||
              "Built to highlight maintenance failures, documented patterns, give a VOICE to HOMEOWNERS"}
          </p>
        </div>

        <div className="space-y-4">
          <img
            src={getImageUrl(comparison.featured_image2, image2)}
            alt={comparison.featured_image2?.altText || "Property comparison"}
          />

          <p className="text-black font-lg">
            <span className="font-bold">DISCLAIMER:</span>{" "}
            {comparison.disclaimer ||
              "This website publishes user-submitted stories and allegations that are not independently verified. HOANightmares.org does not endorse or validate any claims. Content reflects the opinions of individual contributors only."}{" "}
            <i className="font-semibold">
              Users are solely responsible for submitted content.
            </i>
          </p>
          <p className="text-3xl">
            {comparison.mainText ||
              "It Was Supposed to Be Property Management by the HOA,"}{" "}
            <span className="font-semibold">
              {comparison.highlightText ||
                "Not Property Control When Board Members Can Choose Who Gets Property Maintenance, and Who Does Not."}
            </span>
          </p>
          <p className="text-xl font-semibold">
            Real Stories. Real Evidence. Real HOA Failures.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
