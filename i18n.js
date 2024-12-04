const { NextI18Next } = require("next-i18next");
const path = require("path");

const NextI18NextInstance = new NextI18Next({
  defaultLanguage: "en",
  otherLanguages: [
    "fr",
    "zh-hant",   // Traditional Chinese
    "zh-hans",   // Simplified Chinese
    "nl",        // Dutch
    "gu",        // Gujarati
    "hi",        // Hindi
    "it",        // Italian
    "ja",        // Japanese
    "ko",        // Korean
    "pl",        // Polish
    "pt",        // Portuguese
    "ru",        // Russian
    "es",        // Spanish
    "de"         // German
  ],
  localePath: path.resolve("./public/locales"), // Path to locales folder
  ns: [
    "home",
    "common",
    "tagextractor",
    "navbar",
    "titlegenerator",
    "trending",
    "videoDataViewer",
    "banner",
    "logo",
    "search",
    "embed",
    "hashtag",
    "calculator",
    "thumbnail",
    "tdextractor",
    "channelId",
    "monetization",
    "summary",
    "keyword",
    "footer",
    "pricing",
    "description"
  ], // List of namespaces you will be using
  defaultNS: "home",   // The default namespace that will be used
  fallbackNS: "home",  // Fallback namespace when translation is missing
  fallbackLng: "en",     // Fallback language in case the translation is missing in the current language
  debug: process.env.NODE_ENV === "development",  // Enable debug mode in development
  detection: {
    order: ["cookie", "localStorage", "querystring", "path", "subdomain"],
    caches: ["cookie", "localStorage"]
  },
  interpolation: {
    escapeValue: false  // React already escapes values by default
  }
});

module.exports = NextI18NextInstance;
module.exports.default = NextI18NextInstance;
