import puppeteer from 'puppeteer';
import axios from 'axios';

const SCRAPFLY_API_KEY = 'scp-live-b8a1a7829f974c8f9455986a4dc04b5a'; // Scrapfly API Key

// Scrapfly API ব্যবহার করে HTML কন্টেন্ট ফেচ করার জন্য ফাংশন
async function fetchScrapflyContent(url) {
  try {
    const response = await axios({
      method: 'GET',
      url: 'https://api.scrapfly.io/scrape',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SCRAPFLY_API_KEY}`,
      },
      params: {
        api_key: SCRAPFLY_API_KEY,
        url: url,
        render_js: true,
        format: "clean_html", // HTML ফরম্যাটে রেসপন্স নিশ্চিত করা হয়েছে
        proxy_pool: "public_residential", // Residential Proxy Pool ব্যবহার করা
        captcha: 'solve', // Captcha সলভার অপশন যুক্ত করা হয়েছে
      },
    });
    return response.data.result.content; // প্রাপ্ত HTML কন্টেন্ট ফেরত দেয়
  } catch (error) {
    console.error("Error fetching content from Scrapfly:", error.response ? error.response.data : error.message);
    throw error;
  }
}

// API হ্যান্ডলার যা Puppeteer দিয়ে স্ক্র্যাপ করবে
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { url } = req.body;
    let browser;

    try {
      // Scrapfly থেকে HTML কন্টেন্ট ফেচ করা
      const htmlContent = await fetchScrapflyContent(url);

      // Puppeteer দিয়ে ব্রাউজার লঞ্চ করা
      browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
      });

      const page = await browser.newPage();

      // User-Agent সেট করা
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36');

      // কিছু রিসোর্স ব্লক করা (যেমন: CSS, ফন্ট) যাতে লোড টাইম কমে
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        if (['font'].includes(request.resourceType())) {
          request.abort();
        } else {
          request.continue();
        }
      });

      // Puppeteer এ Scrapfly থেকে প্রাপ্ত HTML কন্টেন্ট সেট করা
      await page.setContent(htmlContent);

      // Debugging: Screenshot এবং HTML কন্টেন্ট লোগ করা
      await page.screenshot({ path: 'debug_screenshot.png', fullPage: true });
      console.log("HTML content received from Scrapfly and loaded into Puppeteer");

      // প্রয়োজনীয় ডেটা স্ক্র্যাপ করা
      const data = await page.evaluate(() => {
        const profileImage = document.querySelector('#YouTubeUserTopInfoAvatar img')?.src || 'Not found';
        const userName = document.querySelector('#YouTubeUserTopInfoBlockTop h1')?.innerText.trim() || 'Not found';
        const userHandle = document.querySelector('#YouTubeUserTopInfoBlockTop h4 a')?.innerText.trim() || 'Not found';

        const stats = {
          uploads: document.querySelector('.YouTubeUserTopInfo:nth-child(2) span[style="font-weight: bold;"]')?.innerText || 'Not found',
          subscribers: document.querySelector('.YouTubeUserTopInfo:nth-child(3) span[style="font-weight: bold;"]')?.innerText || 'Not found',
          videoViews: document.querySelector('.YouTubeUserTopInfo:nth-child(4) span[style="font-weight: bold;"]')?.innerText || 'Not found',
          country: document.querySelector('.YouTubeUserTopInfo:nth-child(5) span[style="font-weight: bold;"]')?.innerText || 'Not found',
          channelType: document.querySelector('.YouTubeUserTopInfo:nth-child(6) span[style="font-weight: bold;"]')?.innerText || 'Not found',
          userCreated: document.querySelector('.YouTubeUserTopInfo:nth-child(7) span[style="font-weight: bold;"]')?.innerText || 'Not found',
        };

        return {
          profileImage,
          userName,
          userHandle,
          stats,
        };
      });

      // স্ক্র্যাপড ডেটা রেসপন্সে পাঠানো
      res.status(200).json(data);
    } catch (error) {
      console.error("Error during scraping:", error.message || error);
      res.status(500).json({ error: 'Failed to scrape data' });
    } finally {
      if (browser) await browser.close();
    }
  } else {
    res.status(405).json({ message: 'Only POST method is allowed' });
  }
}
