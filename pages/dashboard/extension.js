import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaCog, FaEye, FaEyeSlash } from "react-icons/fa";
import Layout from "./layout";
import google from "../../public/google_analytics.png"
import recapctha from "../../public/recaptcha3.png"
import tawky_big from "../../public/tawky_big.png"
import Image from "next/image";
const defaultExtensions = [
    { name: "Google Analytics", key: "google_analytics", icon: google },
    { name: "Google Recaptcha 2", key: "google_recaptcha_2", icon: recapctha },
    { name: "Tawk.to", key: "tawk_to", icon: tawky_big },
  ];
const Extensions = () => {
  const [extensions, setExtensions] = useState(defaultExtensions); // Hardcoded extensions
  const [dbExtensions, setDbExtensions] = useState([]); // Extensions from database
  const [selectedExtension, setSelectedExtension] = useState(null); // Selected extension for configuration
  const [configData, setConfigData] = useState({}); // Configuration data
  const [showModal, setShowModal] = useState(false);

  // Fetch database extensions
  useEffect(() => {
    fetchExtensions();
  }, []);

  const fetchExtensions = async () => {
    const token = 'AZ-fc905a5a5ae08609ba38b046ecc8ef00';
    try {
      const response = await fetch("/api/extensions", {
        method: "GET", // Use GET method if you're just fetching data
        headers: {
          "Authorization": `Bearer ${token}`, // Add Authorization header
          "Content-Type": "application/json", // Optional, if the server expects JSON
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        setDbExtensions(result.data);
      } else {
        toast.error("Failed to load extensions from database");
      }
    } catch (error) {
      console.error("Error fetching extensions:", error);
      toast.error("Error fetching extensions");
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
    const token = 'AZ-fc905a5a5ae08609ba38b046ecc8ef00'; // Add your token here
    try {
      const dbExtension = dbExtensions.find((ext) => ext.key === selectedExtension.key);
      if (!dbExtension) {
        // Add new extension to database
        const response = await fetch("/api/extensions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`, // Add Authorization header
          },
          body: JSON.stringify({
            name: selectedExtension.name,
            key: selectedExtension.key,
            status: "Enabled",
            config: configData,
          }),
        });
        const result = await response.json();
        if (result.success) {
          toast.success("Extension added successfully");
          fetchExtensions(); // Refresh database extensions
          setShowModal(false);
        } else {
          toast.error(result.message);
        }
      } else {
        // Update existing extension in database
        const response = await fetch("/api/extensions", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`, // Add Authorization header
          },
          body: JSON.stringify({
            id: dbExtension._id,
            config: configData,
          }),
        });
        const result = await response.json();
        if (result.success) {
          toast.success("Configuration updated successfully");
          fetchExtensions();
          setShowModal(false);
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      toast.error("Failed to save configuration");
    }
  };
  
  const toggleStatus = async (extension) => {
    const token = 'AZ-fc905a5a5ae08609ba38b046ecc8ef00'; // Add your token here
    const dbExtension = dbExtensions.find((ext) => ext.key === extension.key);
  
    if (!dbExtension) {
      // Add new extension to database
      try {
        const response = await fetch("/api/extensions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`, // Add Authorization header
          },
          body: JSON.stringify({
            name: extension.name,
            key: extension.key,
            status: "Enabled",
          }),
        });
        const result = await response.json();
        if (result.success) {
          toast.success("Extension added successfully");
          fetchExtensions();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error("Error adding extension:", error);
        toast.error("Failed to add extension");
      }
    } else {
      // Update existing extension in database
      try {
        const response = await fetch("/api/extensions", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`, // Add Authorization header
          },
          body: JSON.stringify({
            id: dbExtension._id,
            status: dbExtension.status === "Enabled" ? "Disabled" : "Enabled",
          }),
        });
        const result = await response.json();
        if (result.success) {
          toast.success(
            `Extension ${dbExtension.status === "Enabled" ? "disabled" : "enabled"} successfully`
          );
          fetchExtensions();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error("Error toggling status:", error);
        toast.error("Failed to toggle status");
      }
    }
  };
  

  return (
    <Layout>
      <div className="min-h-screen">
        <ToastContainer />
        <h2 className="text-2xl font-bold text-gray-700 mb-6">Extensions</h2>
        <table className="w-full bg-white shadow-md rounded-lg">
          <thead className="bg-[#071251]">
            <tr>
              <th className="py-3 px-4 text-left font-semibold text-white">Extension</th>
              <th className="py-3 px-4 text-center font-semibold text-white">Status</th>
              <th className="py-3 px-4 text-center font-semibold text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {extensions.map((extension) => {
              const dbExtension = dbExtensions.find((ext) => ext.key === extension.key);
              const status = dbExtension?.status || "Disabled";

              return (
                <tr
                  key={extension.key}
                  className="hover:bg-gray-100 transition duration-200 border-b"
                >
                  <td className="py-4 px-4 flex items-center space-x-3">
                    <Image className="rounded" width={40} height={40} src={extension?.icon}/>
                    <span className="font-medium text-gray-800">{extension.name}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span
                      className={`px-3 py-1 text-sm font-semibold rounded-full ${
                        status === "Enabled"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center space-x-2">
                   <div className="d-flex md:ms-60">
                   <button
                      className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 flex items-center"
                      onClick={() => handleConfigure(extension)}
                    >
                      <FaCog className="mr-2" />
                      Configure
                    </button>
                    <button
                      className={`px-4 ms-5 py-1 rounded flex items-center ${
                        status === "Enabled"
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-green-500 text-white hover:bg-green-600"
                      }`}
                      onClick={() => toggleStatus(extension)}
                    >
                      {status === "Enabled" ? (
                        <>
                          <FaEyeSlash className="mr-2" />
                          Disable
                        </>
                      ) : (
                        <>
                          <FaEye className="mr-2" />
                          Enable
                        </>
                      )}
                    </button>
                   </div>
                 
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {showModal && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
              <button
                className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
                onClick={() => setShowModal(false)}
              >
                ✖
              </button>
              <h3 className="text-xl font-semibold mb-4">
                Update Extension: {selectedExtension.name}
              </h3>
              {showModal && (
  <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
      <button
        className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
        onClick={() => setShowModal(false)}
      >
        ✖
      </button>
      <h3 className="text-xl font-semibold mb-4">
        Update Extension: {selectedExtension.name}
      </h3>
      {selectedExtension.key === "google_analytics" && (
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Measurement ID</label>
          <input
            type="text"
            name="measurementId"
            value={configData.measurementId || ""}
            onChange={handleConfigChange}
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Enter Measurement ID"
          />
        </div>
      )}
      {selectedExtension.key === "google_recaptcha_2" && (
        <>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Site Key</label>
            <input
              type="text"
              name="siteKey"
              value={configData.siteKey || ""}
              onChange={handleConfigChange}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Site Key"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Secret Key</label>
            <input
              type="text"
              name="secretKey"
              value={configData.secretKey || ""}
              onChange={handleConfigChange}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Secret Key"
            />
          </div>
        </>
      )}
      {selectedExtension.key === "tawk_to" && (
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">App Key</label>
          <input
            type="text"
            name="appKey"
            value={configData.appKey || ""}
            onChange={handleConfigChange}
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Enter App Key"
          />
        </div>
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
