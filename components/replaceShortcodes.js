// replaceShortcodes.js
import React, { useEffect, useState } from 'react';

// Dynamically import the component based on the component name
const loadComponent = async (componentName) => {
  try {
    const componentModule = await import(`../pages/tools/${componentName}`);
    return componentModule.default;
  } catch (error) {
    console.error(`Error loading component: ${componentName}`, error);
    return null;
  }
};

export function replaceShortcodes(content, shortcodes) {
  const [components, setComponents] = useState({});

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

  // Check if the content is not a string, convert to a string, or handle it gracefully
  if (typeof content !== 'string') {
    console.warn("The content passed to replaceShortcodes is not a string.");
    return content;
  }

  let processedContent = content; // It's confirmed to be a string at this point

  // Replace each shortcode with a corresponding component or JSX element
  for (const shortcode of shortcodes) {
    const regex = new RegExp(`\\[${shortcode.shortcode}\\]`, 'g');

    // Ensure that processedContent is a string for the split operation
    if (typeof processedContent !== 'string') {
      console.error("Processed content is not a string before attempting to split.");
      continue; // Skip further processing for this shortcode
    }

    processedContent = processedContent.split(regex).map((part, index, arr) => (
      <React.Fragment key={`${shortcode.shortcode}-${index}`}>
        <div dangerouslySetInnerHTML={{ __html: part }} /> {/* Render HTML parts */}
        {index !== arr.length - 1 && components[shortcode.shortcode] && React.createElement(components[shortcode.shortcode])}
      </React.Fragment>
    ));
  }

  return processedContent;
}
