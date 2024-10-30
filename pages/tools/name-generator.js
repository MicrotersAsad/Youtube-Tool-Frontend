import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaCopy, FaDownload, FaFacebook, FaInstagram, FaTwitter, FaLinkedin } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const Test = () => {
  const [tags, setTags] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedTitles, setGeneratedTitles] = useState([]);
  const { user, updateUserProfile } = useAuth();
  const [selectAll, setSelectAll] = useState(false);
  const [generateCount, setGenerateCount] = useState(3); // Default value
  const { t } = useTranslation(); // Add translation hook
  const router = useRouter();

  // Use useEffect to access localStorage in the browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCount = parseInt(localStorage.getItem("generateCount") || "3");
      setGenerateCount(savedCount);
    }
  }, []);

  const generateTitles = async () => {
    if (!user) {
      toast.error(t("Please sign in to use this tool."));
      return;
    }

    if (user.paymentStatus !== "success" && user.role !== "admin" && generateCount <= 0) {
      toast.error(t(`You are not upgraded. You can generate titles ${generateCount} more times. Upgrade`));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/openaiKey");
      if (!response.ok) throw new Error(`Failed to fetch API keys: ${response.status}`);

      const keysData = await response.json();
      const apiKeys = keysData.map((key) => key.token);
      let titles = [];
      let success = false;

      for (const key of apiKeys) {
        try {
          const result = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo-16k",
              messages: [
                {
                  role: "system",
                  content: `Generate a list of at least 20 SEO-friendly Channel Names for these keywords: "${tags.join(", ")}".`,
                },
                { role: "user", content: tags.join(", ") },
              ],
              temperature: 0.7,
              max_tokens: 3500,
            }),
          });

          const data = await result.json();
          if (data.choices) {
            titles = data.choices[0].message.content
              .trim()
              .split("\n")
              .map((title) => ({ text: title, selected: false }));
            success = true;
            break;
          }
        } catch (error) {
          console.error("Error with key:", key, error.message);
        }
      }

      if (!success) throw new Error("All API keys exhausted or error occurred");

      setGeneratedTitles(titles);
      if (user.paymentStatus !== "success") {
        const newCount = generateCount - 1;
        setGenerateCount(newCount);
        localStorage.setItem("generateCount", newCount.toString());
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { value } = e.target;
    setInput(value);

    const delimiters = [",", "."];
    const parts = value
      .split(new RegExp(`[${delimiters.join("")}]`))
      .map((part) => part.trim())
      .filter((part) => part);

    if (parts.length > 1) {
      const newTags = [...tags, ...parts];
      setTags(newTags);
      setInput("");
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === "," || event.key === ".") {
      event.preventDefault();
      const newTag = input.trim();
      if (newTag) {
        const newTags = [
          ...tags,
          ...newTag.split(/[,\.]/).map((tag) => tag.trim()).filter((tag) => tag),
        ];
        setTags(newTags);
        setInput("");
      }
    }
  };

  const handleSelectAll = () => {
    const newSelection = !selectAll;
    setSelectAll(newSelection);
    setGeneratedTitles(
      generatedTitles.map((title) => ({
        ...title,
        selected: newSelection,
      }))
    );
  };

  const toggleTitleSelect = (index) => {
    setGeneratedTitles((prevTitles) => {
      const newTitles = [...prevTitles];
      if (newTitles[index]) {
        newTitles[index].selected = !newTitles[index].selected;
        setSelectAll(newTitles.every((title) => title.selected));
      }
      return newTitles;
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success("Copied to clipboard");
      },
      (err) => {
        toast.error("Failed to copy");
      }
    );
  };

  const copySelectedTitles = () => {
    const selectedTitlesText = generatedTitles
      .filter((title) => title.selected)
      .map((title) => title.text.replace(/^\d+\.\s*/, "")) // Remove leading numbers and dots
      .join("\n");
    copyToClipboard(selectedTitlesText);
  };

  const downloadSelectedTitles = () => {
    const selectedTitlesText = generatedTitles
      .filter((title) => title.selected)
      .map((title) => title.text.replace(/^\d+\.\s*/, "")) // Remove leading numbers and dots
      .join("\n");
    const element = document.createElement("a");
    const file = new Blob([selectedTitlesText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "selected_titles.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const shareOnSocialMedia = (platform) => {
    const url = window.location.href;
    let shareUrl;

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent("Check this out!")}`;
        break;
      case "instagram":
        toast.info("Instagram sharing is only available through the app.");
        return;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, "_blank");
  };


  return (
    <div>
      <ToastContainer />
      <div className="border max-w-4xl mx-auto rounded-xl  bg-[#dceffd]">
        <h2 className="text-3xl text-black p-4">YouTube Name Generator</h2>
        <div className="keywords-input-container sm:m-4">
          <div className="tags-container flex flex-wrap gap-2 mb-4">
            {tags.map((tag, index) => (
              <span key={index} className="bg-gray-200 px-2 py-1 rounded-md flex items-center">
                {tag}
                <span className="ml-2 cursor-pointer" onClick={() => setTags(tags.filter((_, i) => i !== index))}>
                  ×
                </span>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Add Niche Separted by Comma"
            className="w-full p-2"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            required
          />
        </div>

        <div className="flex flex-col md:flex-row items-center mt-4 mb-4 md:mt-0 ps-6 pe-6">
  {/* Generate Button */}
  <button
    className="flex items-center justify-center p-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-red-500 mb-4 md:mb-0"
    type="button"
    id="button-addon2"
    onClick={generateTitles}
    disabled={isLoading || tags.length === 0}
  >
    <span className="animate-spin mr-2">
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        viewBox="0 0 512 512"
        xmlns="http://www.w3.org/2000/svg"
        fill="white"
      >
        <path d="M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"></path>
      </svg>
    </span>
    {isLoading ? "Loading..." : "Generate Name"}
  </button>

  {/* Social Media Icons for Mobile */}
  <div className="social-share-container flex justify-center mt-4 md:mt-0 md:ml-auto w-full md:w-auto">
    <FaFacebook
      className="text-blue-600 text-2xl mx-2 cursor-pointer"
      onClick={() => shareOnSocialMedia("facebook")}
    />
    <FaTwitter
      className="text-blue-400 text-2xl mx-2 cursor-pointer"
      onClick={() => shareOnSocialMedia("twitter")}
    />
    <FaInstagram
      className="text-pink-600 text-2xl mx-2 cursor-pointer"
      onClick={() => shareOnSocialMedia("instagram")}
    />
    <FaLinkedin
      className="text-blue-700 text-2xl mx-2 cursor-pointer"
      onClick={() => shareOnSocialMedia("linkedin")}
    />
  </div>
</div>


{generatedTitles.length > 0 && (
  <div className="generated-titles-container">
    <div className="select-all-checkbox">
      <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
      <span>Select All</span>
    </div>
    {generatedTitles.map((title, index) => (
      <div key={index} className="title-checkbox">
        <input
          className="me-2"
          type="checkbox"
          checked={title.selected}
          onChange={() => toggleTitleSelect(index)}
        />
        {title.text}
        <FaCopy className="copy-icon" onClick={() => copyToClipboard(title.text)} />
      </div>
    ))}
    {generatedTitles.some((title) => title.selected) && (
      <button className="btn btn-primary" onClick={copySelectedTitles}>
        Copy All Titles <FaCopy />
      </button>
    )}
    {generatedTitles.some((title) => title.selected) && (
      <button className="btn btn-primary ms-2" onClick={downloadSelectedTitles}>
        Download Titles <FaDownload />
      </button>
    )}
  </div>
)}


      
      </div>
    </div>
  );
};

export default Test;
