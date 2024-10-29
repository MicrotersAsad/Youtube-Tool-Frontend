import React from 'react';
import Test from './tools/name-generator';

// শর্টকোড খুঁজে বের করে JSX রিটার্ন করার ফাংশন
export function replaceShortcodes(content) {
  return content.split('[YTNameGenerator]').map((part, index) => (
    <React.Fragment key={index}>
      {/* HTML কন্টেন্ট হিসেবে রেন্ডার করার জন্য */}
      <div dangerouslySetInnerHTML={{ __html: part }} />
      {/* যদি `[YTTitleGenerator]` পাওয়া যায়, তবে YTTitleGenerator কম্পোনেন্ট রেন্ডার করা */}
      {index !== content.split('[YTNameGenerator]').length - 1 && <Test />}
    </React.Fragment>
  ));
}

// একটি ডিফল্ট কম্পোনেন্ট যা replaceShortcodes ব্যবহার করে
const ReplaceShortcodesPage = ({ content }) => {
  return <div>{replaceShortcodes(content)}</div>;
};

// ReplaceShortcodesPage ডিফল্ট কম্পোনেন্ট হিসেবে এক্সপোর্ট করা
export default ReplaceShortcodesPage;
