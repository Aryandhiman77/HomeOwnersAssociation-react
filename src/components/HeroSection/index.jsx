import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import image1 from "../../assets/images/loveMyHome.png";
import Button from "../Elements/Button";
import image2 from "../../assets/images/property.png";
import Separator from "../Elements/Separator";
import { buildAssetUrl, getJson } from "../../lib/api";
import { getCmsButtonClass } from "../../lib/cmsButtonStyles";

const FALLBACK_BUTTONS = [
  { text: "Submit Your HOA Nightmare", link: "/submit-story", style: "red-text-white" },
  { text: "Browse Horror Stories", link: "/hoa-horror-stories", style: "red-bordered" },
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

  const handleButtonClick = (link) => {
    if (!link) return;
    if (/^https?:\/\//i.test(link)) {
      window.location.assign(link);
      return;
    }
    navigate(link);
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
              {hero.subtitle || "Order Your T-Shirt or Sweat Shirt for the Next Board Meeting."}
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            {buttons.map((button) => (
              <Button
                key={`${button.text}-${button.link}`}
                title={button.text}
                onClick={() => handleButtonClick(button.link)}
                className={getButtonClass(button)}
              />
            ))}
          </div>

          <div className="text-lg text-black space-y-1">
            <p className="space-x-2">
              <input type="checkbox" id="disclaimer" />
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
            {comparison.mainText || "It Was Supposed to Be Property Management by the HOA,"}{" "}
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