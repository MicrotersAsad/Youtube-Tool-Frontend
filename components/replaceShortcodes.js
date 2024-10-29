// replaceShortcodes.js

import React from 'react';
import Test from '../pages/tools/name-generator';

// শর্টকোড খুঁজে বের করে JSX রিটার্ন করার ফাংশন
export function replaceShortcodes(content) {
  // নিশ্চিত করা যে content `undefined` না
  const safeContent = content || ''; // যদি content `undefined` হয়, তখন খালি স্ট্রিং হিসাবে সেট করা

  // যদি কনটেন্টে [YTTitleGenerator] পাওয়া যায়, সেটাকে কম্পোনেন্টে রূপান্তর করা
  return safeContent.split('[YTNameGenerator]').map((part, index) => (
    <React.Fragment key={index}>
      {/* HTML কন্টেন্ট হিসেবে রেন্ডার করার জন্য */}
      <div dangerouslySetInnerHTML={{ __html: part }} />
      {/* যদি `[YTTitleGenerator]` পাওয়া যায়, তবে YTTitleGenerator কম্পোনেন্ট রেন্ডার করা */}
      {index !== safeContent.split('[YTNameGenerator]').length - 1 && <Test />}
    </React.Fragment>
  ));
}
