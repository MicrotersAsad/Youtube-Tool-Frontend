// /pages/api/getKeywordData.js
//api: https://rapidapi.com/ajithjojo1230/api/seo-keyword-research
const https = require('https');

export default function handler(req, res) {
  if (req.method === 'GET') {
    const { keyword, country } = req.query;

    if (!keyword || !country) {
      res.status(400).json({ error: 'Keyword and country are required' });
      return;
    }

    const options = {
      method: 'GET',
      hostname: 'seo-keyword-research.p.rapidapi.com',
      port: null,
      path: `/keynew.php?keyword=${encodeURIComponent(keyword)}&country=${country}`,
      headers: {
        'x-rapidapi-key': 'a1b946d423msh1eb87b4aabe8c4bp17ccc2jsnbe2100aa9add',
        'x-rapidapi-host': 'seo-keyword-research.p.rapidapi.com',
      },
    };

    const request = https.request(options, function (response) {
      const chunks = [];

      response.on('data', function (chunk) {
        chunks.push(chunk);
      });

      response.on('end', function () {
        const body = Buffer.concat(chunks).toString();
        try {
          const json = JSON.parse(body); // Parse the JSON response
          res.status(200).json(json);
        } catch (error) {
          console.error('JSON parse error:', error);
          res.status(500).json({ error: 'Failed to parse response' });
        }
      });
    });

    request.on('error', function (error) {
      console.error('Request error:', error);
      res.status(500).json({ error: 'Failed to fetch keyword data' });
    });

    request.end();
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
