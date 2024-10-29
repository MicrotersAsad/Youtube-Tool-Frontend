// replaceShortcodes.js

import React from 'react';

import Test from './tools/test';

// শর্টকোড খুঁজে বের করে JSX রিটার্ন করার ফাংশন
export function replaceShortcodes(content) {
  return content.split('[YTTitleGenerator]').map((part, index) => (
    <React.Fragment key={index}>
      {/* HTML কন্টেন্ট হিসেবে রেন্ডার করার জন্য */}
      <div dangerouslySetInnerHTML={{ __html: part }} />
      {/* যদি `[YTTitleGenerator]` পাওয়া যায়, তবে YTTitleGenerator কম্পোনেন্ট রেন্ডার করা */}
      {index !== content.split('[YTTitleGenerator]').length - 1 && <Test />}
    </React.Fragment>
  ));
}
