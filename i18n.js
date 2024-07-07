const NextI18Next = require('next-i18next').default;

const NextI18NextInstance = new NextI18Next({
  defaultLanguage: 'en',
  otherLanguages: ['fr', 'es'],
  localePath: typeof window === 'undefined' ? 'public/locales' : 'locales',
});

module.exports = NextI18NextInstance;
