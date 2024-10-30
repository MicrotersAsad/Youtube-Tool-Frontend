import React, { useEffect, useState } from 'react';
import axios from 'axios';

// ডাইনামিক কম্পোনেন্ট লোডিংয়ের জন্য একটি ফাংশন
const loadComponent = async (componentName) => {
  try {
    const componentModule = await import(`../pages/tools/${componentName}`);
    return componentModule.default;
  } catch (error) {
    console.error(`Error loading component: ${componentName}`, error);
    return null;
  }
};

// শর্টকোড খুঁজে বের করে JSX রিটার্ন করার ফাংশন
export function replaceShortcodes(content, shortcodes) {
  const [components, setComponents] = useState({});

  // ডাটাবেস থেকে শর্টকোডের কম্পোনেন্ট লোড করা
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

  // কন্টেন্টকে ডাইনামিকভাবে প্রসেস করা
  if (!content || typeof content !== 'string') return null;

  let processedContent = content;

  // প্রতিটি শর্টকোড প্রসেস করা
  for (const shortcode of shortcodes) {
    const regex = new RegExp(`\\[${shortcode.shortcode}\\]`, 'g');

    // Ensure processedContent is a string before applying split()
    if (typeof processedContent !== 'string') continue;

    processedContent = processedContent.split(regex).map((part, index, arr) => (
      <React.Fragment key={`${shortcode.shortcode}-${index}`}>
        {/* Render each part as HTML content */}
        <div dangerouslySetInnerHTML={{ __html: part }} />
        {/* Render corresponding component if not the last part */}
        {index !== arr.length - 1 &&
          components[shortcode.shortcode] &&
          React.createElement(components[shortcode.shortcode])}
      </React.Fragment>
    ));
  }

  // Wrap the processed content into a React Fragment to render it all together
  return <>{processedContent}</>;
}
