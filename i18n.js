const NextI18Next = require('next-i18next').default;

module.exports = new NextI18Next({
  defaultLanguage: 'en',
  otherLanguages: ['fr', 'de', 'es', 'it', 'pt', 'ja', 'ko', 'zh', 'ru', 'ar', 'hi', 'bn', 'tr', 'nl'],
  localeSubpaths: {
    fr: 'fr',
    de: 'de',
    es: 'es',
    it: 'it',
    pt: 'pt',
    ja: 'ja',
    ko: 'ko',
    zh: 'zh',
    ru: 'ru',
    ar: 'ar',
    hi: 'hi',
    bn: 'bn',
    tr: 'tr',
    nl: 'nl',
  },
});
