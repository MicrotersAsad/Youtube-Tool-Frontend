// replaceShortcodes.js

import React from 'react';
import YTTitleGenerator from './tools/title-generator';

// এই ফাংশন শর্টকোড খুঁজে বের করে JSX রিটার্ন করে
export function replaceShortcodes(content) {
  console.log("Original Content:", content); // লগে মূল কনটেন্ট দেখানো

  // যদি কনটেন্টে [YTTitleGenerator] পাওয়া যায়, সেটাকে কম্পোনেন্টে রূপান্তর করা
  const splitContent = content.split('[YTTitleGenerator]');
  console.log("Split Content:", splitContent); // লগে বিভক্ত কনটেন্ট দেখানো

  return splitContent.map((part, index) => (
    <React.Fragment key={index}>
      <div dangerouslySetInnerHTML={{ __html: part }} />
      {index !== splitContent.length - 1 && <YTTitleGenerator />}
    </React.Fragment>
  ));
}
