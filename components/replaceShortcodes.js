import React, { useEffect, useState } from 'react';

// ডাইনামিক কম্পোনেন্ট লোডিংয়ের জন্য ফাংশন
const loadComponent = async (componentName) => {
  try {
    const componentModule = await import(`../pages/tools/${componentName}`);
    return componentModule.default;
  } catch (error) {
    console.error(`Error loading component: ${componentName}`, error);
    return null;
  }
};

// শর্টকোড প্রসেস করার মূল ফাংশন
export function ReplaceShortcodes({ content, shortcodes }) {
  const [components, setComponents] = useState({});

  // শর্টকোডের জন্য সব কম্পোনেন্ট একবারে লোড করা
  useEffect(() => {
    const loadAllComponents = async () => {
      const componentMap = {};
      for (const shortcode of shortcodes) {
        const component = await loadComponent(shortcode.componentName);
        if (component) {
          componentMap[shortcode.shortcode] = component;
        }
      }
      setComponents(componentMap);
    };

    loadAllComponents();
  }, [shortcodes]);

  // যদি কনটেন্ট না থাকে বা এটি স্ট্রিং না হয়, তাহলে null রিটার্ন করবো
  if (!content || typeof content !== 'string') return null;

  // কনটেন্ট প্রসেস করা
  const regexPattern = shortcodes
    .map((shortcode) => `\\[${shortcode.shortcode}\\]`)
    .join('|'); // একটি regex তৈরি করা যা সকল শর্টকোড ধরবে
  const regex = new RegExp(`(${regexPattern})`, 'g');

  const processedContent = content.split(regex).map((part, index) => {
    // Check if part is a shortcode and render it, otherwise render plain HTML content
    const shortcode = shortcodes.find((sc) => `[${sc.shortcode}]` === part);
    if (shortcode && components[shortcode.shortcode]) {
      const Component = components[shortcode.shortcode];
      return <Component key={`${shortcode.shortcode}-${index}`} />;
    }
    // Render plain text or HTML if it's not a shortcode
    return <span key={`text-${index}`} dangerouslySetInnerHTML={{ __html: part }} />;
  });

  // Return the processed content as JSX
  return <>{processedContent}</>;
}
