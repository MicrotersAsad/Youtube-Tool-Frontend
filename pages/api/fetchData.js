import axios from 'axios';

const SCRAPLY_API_KEY ='scp-live-b8a1a7829f974c8f9455986a4dc04b5a'

const scrapeGoogleTrends = async (country = 'US', timeRange = 'past_7_days') => {
    const url = `https://trends.google.com/trends/explore?geo=${country}&date=${timeRange}&q=`;

    try {
        const response = await axios.post('https://api.scraply.io/v1/scrape', {
            url,
            render: true,
        }, {
            headers: {
                'Authorization': `Bearer ${SCRAPLY_API_KEY}`
            }
        });

        const { data } = response;
        const html = data.html;

        const topics = [];
        const queries = [];

        const topicRegex = /<div class="fe-related-queries-list-item">(.*?)<\/div>/gs;
        const queryRegex = /<div class="fe-related-queries-list-item">(.*?)<\/div>/gs;

        let match;

        while ((match = topicRegex.exec(html)) !== null) {
            const item = match[1];
            const titleMatch = /<div class="title">(.*?)<\/div>/.exec(item);
            const valueMatch = /<div class="value">(.*?)<\/div>/.exec(item);
            const breakoutMatch = /<div class="breakout">(.*?)<\/div>/.exec(item);

            if (titleMatch && valueMatch) {
                topics.push({
                    title: titleMatch[1],
                    value: valueMatch[1],
                    breakout: breakoutMatch ? breakoutMatch[1] : '',
                });
            }
        }

        while ((match = queryRegex.exec(html)) !== null) {
            const item = match[1];
            const titleMatch = /<div class="title">(.*?)<\/div>/.exec(item);
            const valueMatch = /<div class="value">(.*?)<\/div>/.exec(item);
            const breakoutMatch = /<div class="breakout">(.*?)<\/div>/.exec(item);

            if (titleMatch && valueMatch) {
                queries.push({
                    title: titleMatch[1],
                    value: valueMatch[1],
                    breakout: breakoutMatch ? breakoutMatch[1] : '',
                });
            }
        }

        return { topics, queries };
    } catch (error) {
        console.error('Error fetching data from Scraply:', error);
        throw error;
    }
};

export default scrapeGoogleTrends;
