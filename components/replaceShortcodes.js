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
export function replaceShortcodes(content, shortcodes) {
  const [components, setComponents] = useState({});

  // শর্টকোডের জন্য কম্পোনেন্ট লোড করা
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

  let processedContent = content;

  // প্রতিটি শর্টকোড প্রসেস করা
  for (const shortcode of shortcodes) {
    const regex = new RegExp(`\\[${shortcode.shortcode}\\]`, 'g');

    // Ensure processedContent is a string before applying split()
    if (typeof processedContent === 'string') {
      processedContent = processedContent.split(regex).map((part, index, arr) => (
        <React.Fragment key={`${shortcode.shortcode}-${index}`}>
          {/* কনটেন্টের অংশ রেন্ডার করা */}
          <div dangerouslySetInnerHTML={{ __html: part }} />
          
          {/* শর্টকোডের কন্টেন্ট UI-তে দেখানো এবং raw শর্টকোড HTML সোর্সে রাখা */}
          {index !== arr.length - 1 && components[shortcode.shortcode] && (
            <div data-shortcode={`[${shortcode.shortcode}]`}>
              {React.createElement(components[shortcode.shortcode])}
            </div>
          )}
        </React.Fragment>
      ));
    }
  }

  return <>{processedContent}</>;
}
