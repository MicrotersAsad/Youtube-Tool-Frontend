import puppeteer from 'puppeteer';

export default async (req, res) => {
  try {
    const { keyword } = req.body;

    if (!keyword) {
      res.status(400).json({ error: 'Keyword is required' });
      return;
    }

    console.log('Starting Puppeteer...');
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}`;
    console.log(`Navigating to: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });

    const channelLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('#channel-info a#channel-thumbnail'))
        .map(anchor => anchor.href)
        .filter(href => href.includes('/channel/'));
      return [...new Set(links)];
    });

    console.log(`Found channel links: ${channelLinks.length}`);

    let totalChannelsData = [];
    for (const link of channelLinks) {
      const channelData = await getChannelData(link, page);
      if (channelData) {
        totalChannelsData.push(channelData);
      }

      // Ensure we have at least 20 items
      if (totalChannelsData.length >= 20) {
        break;
      }
    }

    console.log(`Total channels data collected: ${totalChannelsData.length}`);
    
    await browser.close();

    res.status(200).json({ channels: totalChannelsData });
  } catch (error) {
    console.error('Error in API route:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getChannelData = async (channelUrl, page) => {
  try {
    console.log(`Navigating to channel URL: ${channelUrl}`);
    await page.goto(channelUrl, { waitUntil: 'networkidle2' });

    const channelData = await page.evaluate(() => {
      const channelName = document.querySelector('#channel-header-container yt-formatted-string')?.innerText || '';
      const channelProfile = document.querySelector('#channel-header-container img#img')?.src || '';
      const subscribers = document.querySelector('#subscriber-count')?.innerText || '';
      const totalViews = document.querySelector('span.view-count')?.innerText || '';
      const videosCount = document.querySelector('span#video-count')?.innerText || '';

      return {
        channelName,
        channelLink: window.location.href,
        channelProfile,
        subscribers,
        totalViews,
        videosCount,
      };
    });

    console.log(`Channel data: ${JSON.stringify(channelData)}`);
    return channelData;
  } catch (error) {
    console.error(`Error navigating to channel URL: ${channelUrl}`, error);
    return null;
  }
};
