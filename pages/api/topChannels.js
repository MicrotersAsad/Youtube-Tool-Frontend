// pages/api/scrapeChannel.js
import puppeteer from 'puppeteer';

export default async function handler(req, res) {
  const { channelId } = req.query;

  if (!channelId) {
    return res.status(400).json({ message: "Channel ID is required" });
  }

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Set a custom User-Agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36');

  try {
    // চ্যানেল আইডি ব্যবহার করে চ্যানেল পেজে সরাসরি নেভিগেট করা
    await page.goto(`https://www.youtube.com/channel/${channelId}`, { waitUntil: 'networkidle2', timeout: 60000 });

    // subscriber count খুঁজে বের করা
    const subscriberCount = await page.evaluate(() => {
      const subscriberElement = document.querySelectorAll('span.yt-core-attributed-string.yt-content-metadata-view-model-wiz__metadata-text')[1];
      return subscriberElement ? subscriberElement.innerText : null;
    });

    // channel title খুঁজে বের করা
    const channelTitle = await page.evaluate(() => {
      const titleElement = document.querySelectorAll('span.yt-core-attributed-string.yt-content-metadata-view-model-wiz__metadata-text')[0];
      return titleElement ? titleElement.innerText : null;
    });

    await browser.close();

    // যদি ডেটা পাওয়া না যায়, তাহলে তা রিটার্ন করা
    if (!channelTitle || !subscriberCount) {
      return res.status(404).json({ message: "Failed to retrieve channel info. Check if selectors are correct." });
    }

    // প্রাপ্ত ডাটা রিটার্ন করা
    res.status(200).json({ channelTitle, subscriberCount });
  } catch (error) {
    await browser.close();
    console.error("Error fetching channel info:", error);
    res.status(500).json({ message: "Failed to scrape channel info" });
  }
}
