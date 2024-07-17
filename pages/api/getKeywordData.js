import { promises as fs } from 'fs';
import path from 'path';
import { format } from 'date-fns';

const API_KEY = process.env.NEXT_PUBLIC_KEYWORDS_EVERYWHERE_API_KEY;


const log = (message) => {
    console.log(`${new Date().toISOString()} | ${message}`);
};

const getKeywordsData = async (keywords, country = 'us', currency = 'USD', dataSource = 'gkp') => {
    if (keywords.length > 100) {
        throw new Error('You can only search for 100 keywords at a time.');
    }

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

    const response = await fetch('https://api.keywordseverywhere.com/v1/get_keyword_data', {
        method: 'POST',
        headers,
        body: new URLSearchParams(payload),
    });

    if (response.ok) {
        const result = await response.json();
        return result.data; // Ensure data is being returned correctly
    } else {
        const errorText = await response.text();
        throw new Error(`API error: ${errorText}`);
    }
};

export default async (req, res) => {
    if (req.method === 'POST') {
        try {
            const { keyword, country } = req.body;
            log(`Fetching data for keyword: ${keyword} in country: ${country}`);
            const data = await getKeywordsData([keyword], country);
            res.status(200).json({ data });
        } catch (error) {
            log(`Error: ${error.message}`);
            res.status(500).json({ error: error.message });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
