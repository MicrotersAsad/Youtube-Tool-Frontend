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
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36'
  );

  try {
    // Navigate to the "About" section of the channel
    const url = `https://www.youtube.com/channel/${channelId}/about`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait for required elements to load
    await page.waitForSelector('#description-container', { timeout: 10000 });
    await page.waitForSelector('#links-section', { timeout: 10000 });
    await page.waitForSelector('#additional-info-container', { timeout: 10000 });

    // Extract subscriber count
    const subscriberCount = await page.evaluate(() => {
      const subscriberElement = document.querySelectorAll(
        'span.yt-core-attributed-string.yt-content-metadata-view-model-wiz__metadata-text'
      )[1];
      return subscriberElement ? subscriberElement.innerText.trim() : null;
    });

    // Extract channel title
    const channelTitle = await page.evaluate(() => {
      const titleElement = document.querySelectorAll(
        'span.yt-core-attributed-string.yt-content-metadata-view-model-wiz__metadata-text'
      )[0];
      return titleElement ? titleElement.innerText.trim() : null;
    });

    // Extract video count
    const channelVideo = await page.evaluate(() => {
      const videoElement = document.querySelectorAll(
        'span.yt-core-attributed-string.yt-content-metadata-view-model-wiz__metadata-text'
      )[2];
      return videoElement ? videoElement.innerText.trim() : null;
    });

    // Extract channel description
    const channelDescription = await page.evaluate(() => {
      const descriptionElement = document.querySelector('#description-container');
      return descriptionElement ? descriptionElement.innerText.trim() : null;
    });

    // Extract external links
    const externalLinks = await page.evaluate(() => {
      const links = [];
      const linkElements = document.querySelectorAll('#link-list-container yt-channel-external-link-view-model');

      linkElements.forEach((linkElement) => {
        const titleElement = linkElement.querySelector(
          'span.yt-core-attributed-string.yt-channel-external-link-view-model-wiz__title'
        );
        const urlElement = linkElement.querySelector(
          'a.yt-core-attributed-string__link'
        );

        const title = titleElement ? titleElement.innerText.trim() : null;
        const url = urlElement ? urlElement.href : null;

        if (title && url) {
          links.push({ title, url });
        }
      });
      return links;
    });

    // Extract additional channel details (Joined Date, Location, Total Views)
    const additionalInfo = await page.evaluate(() => {
      const info = {};

      // Joined Date
      const joinedDate = document.querySelector(
        '#additional-info-container .description-item span[role="text"]'
      );
      info.joinedDate = joinedDate ? joinedDate.innerText.trim() : null;

      // Location - Try multiple selectors
      const location = document.querySelector(
        '#additional-info-container .description-item .style-scope.ytd-about-channel-renderer[role="text"]'
      ) || document.querySelector(
        '#additional-info-container .description-item span.yt-core-attributed-string[role="text"]'
      );
      info.location = location ? location.innerText.trim() : null;

      // Total Views
      const views = Array.from(document.querySelectorAll(
        '#additional-info-container .description-item'
      )).find(element => element.innerText.includes('views'));
      info.totalViews = views ? views.innerText.split('views').shift().trim() + " views" : null;

      return info;
    });

    await browser.close();

    // Return all data in a single JSON response
    res.status(200).json({
      channelTitle,
      subscriberCount,
      channelVideo,
      channelDescription,
      externalLinks,
      additionalInfo
    });
  } catch (error) {
    await browser.close();
    console.error("Error fetching channel info:", error);
    res.status(500).json({ message: "Failed to scrape channel info" });
  }
}
