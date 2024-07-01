import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

export default async function handler(req, res) {
    const { keyword } = req.query;

    if (!keyword) {
        return res.status(400).json({ error: 'Keyword is required' });
    }

    const apiKey = 'scp-live-b8a1a7829f974c8f9455986a4dc04b5a'; // Replace with your Scrapfly API key
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}`;

    const scrapflyUrl = `https://api.scrapfly.io/scrape?url=${encodeURIComponent(url)}&render_js=true&key=${apiKey}`;

    try {
        const response = await fetch(scrapflyUrl, { method: 'GET' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const html = data.result.content;

        console.log('HTML Content:', html); // Log the HTML content for debugging

        const dom = new JSDOM(html);
        const document = dom.window.document;

        const videoData = [];
        const videoElements = document.querySelectorAll('ytd-video-renderer, ytd-grid-video-renderer');

        videoElements.forEach((element, index) => {
            try {
                const titleElement = element.querySelector('#video-title');
                const urlElement = titleElement?.href ? titleElement : element.querySelector('a#thumbnail');
                const viewsElement = element.querySelector('.view-count, #metadata-line span:nth-child(1)');
                const channelElement = element.querySelector('.yt-simple-endpoint.style-scope.yt-formatted-string');
                const thumbnailElement = element.querySelector('img');

                if (titleElement && urlElement && channelElement && thumbnailElement) {
                    videoData.push({
                        title: titleElement.textContent.trim(),
                        url: `https://www.youtube.com${urlElement.getAttribute('href')}`,
                        views: viewsElement ? viewsElement.textContent.trim() : 'N/A',
                        channel: channelElement.textContent.trim(),
                        thumbnail: thumbnailElement.src,
                    });
                }
            } catch (error) {
                console.error(`Error processing video element ${index + 1}:`, error);
            }
        });

        const responseData = {
            keywords: [keyword],
            image_count: videoData.length,
            scrapper: 'scrapfly',
            videos: videoData.slice(0, 20)
        };

        console.log('Response Data:', responseData); // Log the response data for debugging

        res.status(200).json(responseData); // Return first 20 videos
    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).json({ error: 'Error fetching data' });
    }
}
