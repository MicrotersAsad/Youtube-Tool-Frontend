import axios from 'axios';

const API_KEY = process.env.NEXT_PUBLIC_KEYWORDS_EVERYWHERE_API_KEY;
const SCRAPFLY_API_KEY = process.env.NEXT_PUBLIC_SCRAPFLY_API_KEY;

const log = (message) => {
    console.log(`${new Date().toISOString()} | ${message}`);
};

const getKeywordsData = async (keywords, country = 'us', currency = 'USD', dataSource = 'gkp') => {
    const payload = {
        country,
        currency,
        dataSource,
        'kw[]': keywords,
    };

    const headers = {
        Accept: 'application/json',
        Authorization: `Bearer ${API_KEY}`,
    };

    try {
        const response = await fetch('https://api.keywordseverywhere.com/v1/get_keyword_data', {
            method: 'POST',
            headers,
            body: new URLSearchParams(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error: ${errorText}`);
        }

        const result = await response.json();
        return result.data; // Return the keyword data
    } catch (error) {
        log(`Failed to fetch keywords data: ${error.message}`);
        throw error;
    }
};

const getGoogleSuggestedKeywords = async (keyword) => {
    const url = `https://www.google.com/complete/search?q=${encodeURIComponent(keyword)}&client=chrome`;

    try {
        const response = await axios.get('https://api.scrapfly.io/scrape', {
            params: {
                key: SCRAPFLY_API_KEY,
                url: url,
                render_js: false,
                wait_for: 'networkidle',
            },
        });

        if (response.data && response.data.result && response.data.result.content) {
            const content = JSON.parse(response.data.result.content);

            if (Array.isArray(content) && Array.isArray(content[1])) {
                const suggestions = content[1];
                return suggestions; // Return the array of suggestions
            } else {
                log(`Unexpected suggestions structure: ${JSON.stringify(content)}`);
                throw new Error('Unexpected suggestions structure.');
            }
        } else {
            log(`Unexpected response structure: ${JSON.stringify(response.data)}`);
            throw new Error('Unexpected response structure from Scrapfly.');
        }
    } catch (error) {
        log(`Failed to fetch Google suggestions: ${error.message}`);
        throw error;
    }
};

export default async (req, res) => {
    if (req.method === 'POST') {
        try {
            const { keyword, country } = req.body;

            if (!keyword) {
                return res.status(400).json({ error: 'Keyword is required' });
            }

            if (!country || typeof country !== 'string' || country.length !== 2) {
                return res.status(400).json({ error: 'Valid country code is required' });
            }

            log(`Fetching data for keyword: ${keyword} in country: ${country}`);
            const keywordData = await getKeywordsData([keyword], country);
            const googleSuggestions = await getGoogleSuggestedKeywords(keyword);

            // Array to hold all the suggested keyword data
            const googleSuggestionKeywords = [];

            // Iterate over each suggested keyword and fetch its data
            for (const suggestedKeyword of googleSuggestions) {
                const suggestionData = await getKeywordsData([suggestedKeyword], country);
                if (suggestionData && suggestionData.length > 0) {
                    googleSuggestionKeywords.push({
                        keyword: suggestionData[0].keyword,
                        volume: suggestionData[0].vol,
                        cpc: suggestionData[0].cpc,
                        competition: suggestionData[0].competition,
                        country: suggestionData[0].country || country,
                    });
                }
            }

            const relatedKeywords = keywordData.map(item => ({
                keyword: item.keyword,
                volume: item.vol,
                cpc: item.cpc,
                competition: item.competition,
                country: item.country || country,
                trend: item.trend || [],
            }));

            return res.status(200).json({ keyword, relatedKeywords, googleSuggestionKeywords });
        } catch (error) {
            log(`Error: ${error.message}`);
            return res.status(500).json({ error: error.message });
        }
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
};
