// replaceShortcodes.js
import React, { useEffect, useState } from 'react';


// Dynamically load the component based on the component name
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
    // Load components based on the provided shortcodes
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

    if (shortcodes && shortcodes.length > 0) {
      loadAllComponents();
    }
  }, [shortcodes]);

  // Ensure content is a string to avoid null errors
  if (!content || typeof content !== 'string') return null;

  let processedContent = [content];

  // Process each shortcode
  for (const shortcode of shortcodes) {
    const regex = new RegExp(`\\[${shortcode.shortcode}\\]`, 'g');
    const tempContent = [];

    processedContent.forEach((chunk, index) => {
      if (typeof chunk === 'string') {
        // Split the chunk by the shortcode regex
        const parts = chunk.split(regex);
        // Loop through each part and push it into tempContent array
        parts.forEach((part, partIndex) => {
          tempContent.push(part);
          // Add the component after each part, except for the last one
          if (partIndex < parts.length - 1) {
            const Component = components[shortcode.shortcode];
            if (Component) {
              tempContent.push(<Component key={`${shortcode.shortcode}-${index}-${partIndex}`} />);
            }
          }
        });
      } else {
        // If it's already a JSX element, keep it as-is
        tempContent.push(chunk);
      }
    });

    processedContent = tempContent;
  }

  return <>{processedContent}</>;
}
