import React, { useEffect, useState } from "react";
import Head from "next/head";
import { ToastContainer } from "react-toastify";
import { useTranslation } from "react-i18next";

const YouTubeMoneyCalculator = () => {
  const { t } = useTranslation("calculator");
  
  // CPM State
  const [cpmViews, setCpmViews] = useState({ daily: 0, monthly: 0, yearly: 0 });
  const [minCPM, setMinCPM] = useState(0.3);
  const [maxCPM, setMaxCPM] = useState(4);
  const [dailyCpmViews, setDailyCpmViews] = useState(0);

  // CTR State
  const [ctrViews, setCtrViews] = useState({ daily: 0, monthly: 0, yearly: 0 });
  const [engagement, setEngagement] = useState(0);
  const [dailyCtrViews, setDailyCtrViews] = useState(0);
  const [ctrEarnings, setCtrEarnings] = useState({ daily: [0, 0], monthly: [0, 0], yearly: [0, 0] });

  const [activeTab, setActiveTab] = useState("CPM"); // Added state for active tab

  // Calculate Earnings based on CPM and views
  const calculateEarnings = (views, rate) => (views / 1000) * rate;

  // Daily, Monthly, and Yearly Earnings for CPM
  const cpmEarnings = {
    daily: {
      min: calculateEarnings(dailyCpmViews, minCPM),
      max: calculateEarnings(dailyCpmViews, maxCPM),
    },
    monthly: {
      min: calculateEarnings(dailyCpmViews * 30, minCPM),
      max: calculateEarnings(dailyCpmViews * 30, maxCPM),
    },
    yearly: {
      min: calculateEarnings(dailyCpmViews * 365, minCPM),
      max: calculateEarnings(dailyCpmViews * 365, maxCPM),
    },
  };

  // Update CPM Views State
  useEffect(() => {
    setCpmViews({
      daily: dailyCpmViews,
      monthly: dailyCpmViews * 30,
      yearly: dailyCpmViews * 365,
    });
  }, [dailyCpmViews]);

  // Update CTR Views State
  useEffect(() => {
    setCtrViews({
      daily: dailyCtrViews,
      monthly: dailyCtrViews * 30,
      yearly: dailyCtrViews * 365,
    });
  }, [dailyCtrViews]);

  // Calculate Earnings for CTR
  useEffect(() => {
    const calculateEarningsForRange = (views, engagementRate) => {
      const baseEarnings = (views * engagementRate) / 1000;
      return [
        (baseEarnings * minCPM).toFixed(2),
        (baseEarnings * maxCPM).toFixed(2),
      ];
    };

    setCtrEarnings({
      daily: calculateEarningsForRange(ctrViews.daily, engagement),
      monthly: calculateEarningsForRange(ctrViews.monthly, engagement),
      yearly: calculateEarningsForRange(ctrViews.yearly, engagement),
    });
  }, [ctrViews, minCPM, maxCPM, engagement]);

  return (
    <>
      <Head>
        <title>YouTube Money Calculator</title>
      </Head>
      <div className="calculator-box">
        <ToastContainer />

        {/* Tabs for selecting CPM or CTR */}
        <div className="tabs border rounded">
          <button
            className={`tab ${activeTab === "CPM" ? "active" : ""}`}
            onClick={() => setActiveTab("CPM")}
          >
            {t("Estimated Total Earnings by CPM")}
          </button>
          <button
            className={`tab ${activeTab === "CTR" ? "active" : ""}`}
            onClick={() => setActiveTab("CTR")}
          >
            {t("Estimated Total Earnings by CTR")}
          </button>
        </div>

        {/* Conditionally Render Content Based on Active Tab */}
        {activeTab === "CPM" && (
          <div className="calculator-box">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Inputs */}
              <div>
                {/* Daily Views Input */}
                <div className="input-group">
                  <label className="input-label">{t("Daily Views")}</label>
                  <input
                    type="number"
                    className="input-field"
                    value={dailyCpmViews}
                    onChange={(e) => setDailyCpmViews(Number(e.target.value))}
                  />
                  <input
                    type="range"
                    min="0"
                    max="4000000"
                    step="1000"
                    value={dailyCpmViews}
                    onChange={(e) => setDailyCpmViews(Number(e.target.value))}
                    className="range-slider views-slider"
                  />
                  <div className="range-labels">
                    <span>0</span>
                    <span>1 000 000</span>
                    <span>2 000 000</span>
                    <span>3 000 000</span>
                    <span>4 000 000</span>
                  </div>
                </div>

                {/* CPM Range Input with Box */}
                <div className="cpm-box">
                  <label className="input-label">{t("Estimated CPM - ($0 - $4)")}</label>
                  <div className="cpm-inputs">
                    <input
                      type="number"
                      className="cpm-input"
                      value={minCPM}
                      onChange={(e) => setMinCPM(Number(e.target.value))}
                      min="0"
                      max="4"
                      step="0.1"
                    />
                    <span className="cpm-separator">-</span>
                    <input
                      type="number"
                      className="cpm-input"
                      value={maxCPM}
                      onChange={(e) => setMaxCPM(Number(e.target.value))}
                      min="0"
                      max="4"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Estimated Earnings with Box */}
              <div className="earnings-display-box">
                <h3 className="earnings-title">{t("Estimated Total Earnings by CPM")}</h3>
                <div className="earnings-values">
                  <p>{t("Estimated Daily Earnings")}:</p>
                  <h6 className="earnings-amount">${cpmEarnings.daily.min.toFixed(2)} - ${cpmEarnings.daily.max.toFixed(2)}</h6>

                  <p className="mt-3">{t("Estimated Monthly Earnings")}:</p>
                  <h6 className="earnings-amount">${cpmEarnings.monthly.min.toFixed(2)} - ${cpmEarnings.monthly.max.toFixed(2)}</h6>

                  <p className="mt-3">{t("Estimated Yearly Projected")}:</p>
                  <h6 className="earnings-amount">${cpmEarnings.yearly.min.toFixed(2)} - ${cpmEarnings.yearly.max.toFixed(2)}</h6>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "CTR" && (
          <div className="calculator-box dashboard">
            <div className="views-section">
              <h3>Daily Views</h3>
              <div className="views-summary">
                <p>{ctrViews.daily} Views/Day</p>
                <p>{ctrViews.monthly} Views/Month</p>
                <p>{ctrViews.yearly} Views/Year</p>
              </div>

              <div className="slider-container">
                <label>Views:</label>
                <input
                  type="range"
                  min="0"
                  max="50000"
                  value={ctrViews.daily}
                  onChange={(e) => setDailyCtrViews(Number(e.target.value))}
                />
                <div className="range-labels">
                  <span>0</span>
                  <span>50,000</span>
                </div>
              </div>

              <h3>Average Engagement (CTR)</h3>
              <div className="slider-container">
                <label>CTR:</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={engagement}
                  onChange={(e) => setEngagement(Number(e.target.value))}
                />
                <div className="range-labels">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div className="earnings-section">
              <h3>Estimated Daily Earnings</h3>
              <p className="earnings">${ctrEarnings.daily[0]} - ${ctrEarnings.daily[1]}</p>

              <h3>Estimated Monthly Earnings</h3>
              <p className="earnings">${ctrEarnings.monthly[0]} - ${ctrEarnings.monthly[1]}</p>

              <h3>Estimated Yearly Projected</h3>
              <p className="earnings">${ctrEarnings.yearly[0]} - ${ctrEarnings.yearly[1]}</p>
            </div>
          </div>
        )}
          <style jsx>{`
      .tabs {
          display: flex;
          margin-bottom: 20px;
        }
        .tab {
          flex: 1;
          padding: 10px;
          text-align: center;
          cursor: pointer;
          font-weight: bold;
          border-radius: 8px;
          transition: background-color 0.3s;
        }
        .tab.active {
          background-color: #ff0000;
          color: #fff;
        }
        .calculator-container {
          background-color: #f9f9f9;
          padding: 20px 0 40px;
        }
        .calculator-container {
          background-color: #f9f9f9;
          padding: 20px 0 40px;
        }
        .calculator-box {
          background-color: #fff;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
        }
        .input-group {
          margin-bottom: 20px;
        }
        .input-label {
          display: block;
          font-weight: bold;
          color: #333;
          margin-bottom: 8px;
        }
        .input-field {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin-bottom: 10px;
        }
        .range-slider {
          width: 100%;
          -webkit-appearance: none;
          height: 8px;
          background: #ddd;
          outline: none;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          background-color: red;
          cursor: pointer;
          border-radius: 50%;
        }
        .range-labels {
          display: flex;
          justify-content: space-between;
          color: #666;
          font-size: 12px;
          margin-top: 4px;
        }
        .cpm-box {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
        }
        .cpm-inputs {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }
        .cpm-input {
          width: 60px;
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
          text-align: center;
        }
        .cpm-separator {
          margin: 0 8px;
          font-weight: bold;
        }
        .earnings-display-box {
          border: 1px solid #ddd;
          padding: 20px;
          border-radius: 8px;
          background-color: #fefefe;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
        }
        .earnings-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: #333;
          margin-bottom: 10px;
        }
        .earnings-values h6 {
          font-size: 1rem;
          font-weight: bold;
          margin: 6px 0;
        }
        .earnings-amount {
          color: #ff0000;
        }
          
        .views-section, .earnings-section {
          flex: 1;
          padding: 20px;
        }

        .views-section {
          border-right: 1px solid #ddd;
        }

        .earnings-section {
          padding-left: 40px;
        }

        h3 {
          font-size: 1.2em;
          color: #555;
          margin-bottom: 10px;
        }

        p {
          font-size: 1em;
          color: #000;
          margin: 5px 0;
        }

        .slider-container {
          margin: 20px 0;
        }

        input[type="range"] {
          width: 100%;
          appearance: none;
          height: 6px;
          background: #ddd;
          border-radius: 5px;
          outline: none;
        }

        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 15px;
          height: 15px;
          background-color: #ff4d4d;
          border-radius: 50%;
          cursor: pointer;
        }

        input[type="range"]::-moz-range-thumb {
          width: 15px;
          height: 15px;
          background-color: #ff4d4d;
          border-radius: 50%;
          cursor: pointer;
        }

        label {
          display: block;
          font-size: 0.9em;
          color: #888;
          margin-bottom: 5px;
        }
          .dashboard {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
          padding: 20px;
          border-radius: 8px;
          background-color: #f9f9f9;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          color: #333;
          max-width: 800px;
          margin: 0 auto;
        }

        .views-section {
          padding: 20px;
        }

        .earnings-section {
          padding: 20px;
          border-left: 1px solid #ddd;
        }

        .views-summary {
          display: flex;
          gap: 20px;
          font-weight: bold;
        }

        h3 {
          font-size: 1em;
          color: #333;
          margin-bottom: 10px;
        }

        p {
          font-size: 1em;
          color: #000;
          margin: 5px 0;
        }

        .earnings {
          font-size: 1.2em;
          color: #ff4d4d;
          font-weight: bold;
        }

        .slider-container {
          margin: 20px 0;
        }

        input[type="range"] {
          width: 100%;
          appearance: none;
          height: 6px;
          background: #ddd;
          border-radius: 5px;
          outline: none;
        }

        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 15px;
          height: 15px;
          background-color: #ff4d4d;
          border-radius: 50%;
          cursor: pointer;
        }

        input[type="range"]::-moz-range-thumb {
          width: 15px;
          height: 15px;
          background-color: #ff4d4d;
          border-radius: 50%;
          cursor: pointer;
        }

        .range-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.8em;
          color: #888;
        }
 .dashboard{
 background-color: #fff;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
 }
        @media (max-width: 768px) {
          .dashboard {
            grid-template-columns: 1fr;
          }

          .earnings-section {
            border-left: none;
            border-top: 1px solid #ddd;
            padding-top: 0;
            margin-top: 20px;
          }
        }

      `}</style>
      </div>
    </>
  );
};

export default YouTubeMoneyCalculator;
