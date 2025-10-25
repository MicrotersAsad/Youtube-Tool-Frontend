import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Layout from "./layout";
import stripeIcon from "../../public/stripe.png";
import paypalIcon from "../../public/paypal.png";
import Image from "next/image";

const defaultExtensions = [
  { name: "Stripe", key: "stripe_config", icon: stripeIcon },
  { name: "PayPal", key: "paypal_config", icon: paypalIcon },
];

const Extensions = () => {
  const [extensions, setExtensions] = useState(defaultExtensions);
  const [dbExtensions, setDbExtensions] = useState([]);
  const [selectedExtension, setSelectedExtension] = useState(null);
  const [configData, setConfigData] = useState({});
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchExtensions();
  }, []);

  

  const fetchExtensions = async () => {
    const token = 'fc905a5a5ae08609ba38b046ecc8ef00';
    try {
      const response = await fetch("/api/paymentConfig", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();
      if (result.success) {
        setDbExtensions([
          { key: "stripe_config", config: result.data.stripe || {} },
          { key: "paypal_config", config: result.data.paypal || {} },
        ]);
      } else {
        toast.error("Failed to load payment configs");
      }
    } catch (error) {
      console.error("Error fetching configs:", error);
      toast.error("Error fetching configs");
    }
  };

  const handleConfigure = (extension) => {
    setSelectedExtension(extension);
    const dbConfig = dbExtensions.find((ext) => ext.key === extension.key)?.config || {};
    setConfigData(dbConfig);
    setShowModal(true);
  };

  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    setConfigData((prev) => ({ ...prev, [name]: value }));
  };

  const saveConfig = async () => {
    const token = 'fc905a5a5ae08609ba38b046ecc8ef00';
    const key = selectedExtension.key;

    try {
      const method = dbExtensions.find((ext) => ext.key === key && Object.keys(ext.config || {}).length) ? "PUT" : "POST";
      const body = method === "PUT" 
        ? { key, config: configData } 
        : key === "stripe_config" 
          ? { stripe: configData } 
          : { paypal: configData };

      const response = await fetch("/api/paymentConfig", {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Configuration saved successfully");
        fetchExtensions();
        setShowModal(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Failed to save config");
    }
  };

  return (
    <Layout>
      <div className="min-h-screen p-4">
        <ToastContainer />
        <h2 className="text-2xl font-bold text-gray-700 mb-6">Payment Configuration</h2>
        <table className="w-full bg-white shadow-md rounded-lg">
          <thead className="bg-[#071251]">
            <tr>
              <th className="py-3 px-4 text-left text-white">Service</th>
              <th className="py-3 px-4 text-center text-white">Status</th>
              <th className="py-3 px-4 text-center text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {extensions.map((ext) => {
              const isConfigured = !!dbExtensions.find((d) => d.key === ext.key && Object.keys(d.config || {}).length);
              return (
                <tr key={ext.key} className="border-b hover:bg-gray-100">
                  <td className="py-4 px-4 flex items-center space-x-3">
                    <Image src={ext.icon} width={40} height={40} alt={ext.name} />
                    <span className="font-medium text-gray-800">{ext.name}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    {isConfigured ? (
                      <span className="text-green-600 font-semibold">Configured</span>
                    ) : (
                      <span className="text-red-600 font-semibold">Not Configured</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
                      onClick={() => handleConfigure(ext)}
                    >
                      {isConfigured ? "Update" : "Configure"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
              <button
                className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
                onClick={() => setShowModal(false)}
              >✖</button>
              <h3 className="text-xl font-semibold mb-4">
                {selectedExtension.name} Configuration
              </h3>

              {selectedExtension.key === "stripe_config" && (
                <>
                  <input type="text" name="STRIPE_PUBLISHABLE_KEY" value={configData.STRIPE_PUBLISHABLE_KEY || ""} onChange={handleConfigChange} placeholder="Publishable Key" className="mb-2 w-full border px-3 py-2 rounded" />
                  <input type="text" name="STRIPE_SECRET_KEY" value={configData.STRIPE_SECRET_KEY || ""} onChange={handleConfigChange} placeholder="Secret Key" className="mb-2 w-full border px-3 py-2 rounded" />
                  <input type="text" name="STRIPE_MONTHLY_PRICE_ID" value={configData.STRIPE_MONTHLY_PRICE_ID || ""} onChange={handleConfigChange} placeholder="Monthly Price ID" className="mb-2 w-full border px-3 py-2 rounded" />
                  <input type="text" name="STRIPE_YEARLY_PRICE_ID" value={configData.STRIPE_YEARLY_PRICE_ID || ""} onChange={handleConfigChange} placeholder="Yearly Price ID" className="mb-4 w-full border px-3 py-2 rounded" />
                </>
              )}

              {selectedExtension.key === "paypal_config" && (
                <>
                  <input type="text" name="PAYPAL_CLIENT_ID" value={configData.PAYPAL_CLIENT_ID || ""} onChange={handleConfigChange} placeholder="PayPal Client ID" className="mb-2 w-full border px-3 py-2 rounded" />
                  <input type="text" name="PAYPAL_CLIENT_SECRET" value={configData.PAYPAL_CLIENT_SECRET || ""} onChange={handleConfigChange} placeholder="PayPal Secret" className="mb-4 w-full border px-3 py-2 rounded" />
                </>
              )}

              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 w-full"
                onClick={saveConfig}
              >
                Save Configuration
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Extensions;