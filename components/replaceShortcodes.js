import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// ডাইনামিক কম্পোনেন্ট লোডিংয়ের জন্য ফাংশন
const loadDynamicComponent = (componentName) => {
  try {
    return dynamic(() => import(`../pages/tools/${componentName}`), {
      ssr: true,
    });
  } catch (error) {
    console.error(`Error loading component: ${componentName}`, error);
    return null;
  }
};

// শর্টকোড প্রসেস করার মূল ফাংশন
export function ReplaceShortcodes({ content, shortcodes }) {
  const [components, setComponents] = useState({});

  useEffect(() => {
    // শর্টকোডের জন্য ডাইনামিক কম্পোনেন্ট একবারে লোড করা
    const loadAllComponents = () => {
      const componentMap = {};
      for (const shortcode of shortcodes) {
        const DynamicComponent = loadDynamicComponent(shortcode.componentName);
        if (DynamicComponent) {
          componentMap[shortcode.shortcode] = DynamicComponent;
        }
      }
      setComponents(componentMap);
    };

    loadAllComponents();
  }, [shortcodes]);

  // যদি কনটেন্ট না থাকে বা এটি স্ট্রিং না হয়, তাহলে null রিটার্ন করবো
  if (!content || typeof content !== "string") return null;

  // কনটেন্ট প্রসেস করা
  const regexPattern = shortcodes
    .map((shortcode) => `\\[${shortcode.shortcode}\\]`)
    .join("|"); // একটি regex তৈরি করা যা সকল শর্টকোড ধরবে
  const regex = new RegExp(`(${regexPattern})`, "g");

  const processedContent = content.split(regex).map((part, index) => {
    // Check if part is a shortcode and render it, otherwise render plain HTML content
    const shortcode = shortcodes.find((sc) => `[${sc.shortcode}]` === part);
    if (shortcode && components[shortcode.shortcode]) {
      const DynamicComponent = components[shortcode.shortcode];
      return <DynamicComponent key={`${shortcode.shortcode}-${index}`} />;
    }
    // Render plain text or HTML if it's not a shortcode
    return <span key={`text-${index}`} dangerouslySetInnerHTML={{ __html: part }} />;
  });

  // Return the processed content as JSX
  return <>{processedContent}</>;
}
