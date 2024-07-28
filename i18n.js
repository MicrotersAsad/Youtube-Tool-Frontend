const NextI18Next = require("next-i18next").default;
const path = require("path");

const NextI18NextInstance = new NextI18Next({
  defaultLanguage: "en",
  otherLanguages: [
    "fr",
    "zh-HANT",
    "zh-HANS",
    "nl",
    "gu",
    "hi",
    "it",
    "ja",
    "ko",
    "pl",
    "pt",
    "ru",
    "es",
    "de"
  ],
  localePath: path.resolve("./public/locales"),
  ns: [
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
  ], // Specify your namespaces here
  defaultNS: "common", // Set a default namespace
  fallbackNS: "common"
});

module.exports = NextI18NextInstance;
module.exports.default = NextI18NextInstance;
