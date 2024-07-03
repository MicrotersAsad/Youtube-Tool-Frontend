/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

import YouTubeDescriptionGenerator from "./DescriptionGenerator";
import TitleGenerator from "./Titlegenerator";

const TitleDescription = () => {
  const router = useRouter();
  const { tab } = router.query;
  const [activeTab, setActiveTab] = useState(tab || "title");

  useEffect(() => {
    if (tab !== activeTab) {
      if (activeTab === "title") {
        router.push({ pathname: router.pathname, query: { tab: "title" } }, undefined, { shallow: true });
      } else if (activeTab === "description") {
        router.push({ pathname: router.pathname, query: { tab: "description" } }, undefined, { shallow: true });
      }
    }
  }, [activeTab, tab, router]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h3 className="pt-5 text-3xl text-center p-5">YouTube Title and Description Generator</h3>

      <ul className="nav nav-pills mb-3 border rounded" id="pills-tab" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === "title" ? "active" : ""}`}
            id="pills-home-tab"
            onClick={() => handleTabChange("title")}
            type="button"
            role="tab"
            aria-controls="pills-home"
            aria-selected={activeTab === "title"}
          >
            YouTube Title Generator
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === "description" ? "active" : ""}`}
            id="pills-profile-tab"
            onClick={() => handleTabChange("description")}
            type="button"
            role="tab"
            aria-controls="pills-profile"
            aria-selected={activeTab === "description"}
          >
            YouTube Description Generator
          </button>
        </li>
      </ul>

      <div className="tab-content" id="pills-tabContent">
        <div
          className={`tab-pane fade ${activeTab === "title" ? "show active" : ""}`}
          id="pills-home"
          role="tabpanel"
          aria-labelledby="pills-home-tab"
        >
          <TitleGenerator />
        </div>
        <div
          className={`tab-pane fade ${activeTab === "description" ? "show active" : ""}`}
          id="pills-profile"
          role="tabpanel"
          aria-labelledby="pills-profile-tab"
        >
          <YouTubeDescriptionGenerator />
        </div>
      </div>
    </div>
  );
};

export default TitleDescription;
