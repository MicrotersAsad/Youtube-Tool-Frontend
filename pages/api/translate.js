// pages/api/translate.js
import https from 'https';
import querystring from 'querystring';

export default function handler(req, res) {
  const { text, targetLanguage } = req.body;

  const options = {
    method: 'POST',
    hostname: 'google-translate1.p.rapidapi.com',
    port: null,
    path: '/language/translate/v2',
    headers: {
      'x-rapidapi-key': 'a1b946d423msh1eb87b4aabe8c4bp17ccc2jsnbe2100aa9add', // Replace with your actual RapidAPI key
      'x-rapidapi-host': 'google-translate1.p.rapidapi.com',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  const data = querystring.stringify({
    q: text,
    target: targetLanguage,
  });

  const request = https.request(options, (response) => {
    const chunks = [];

    response.on('data', (chunk) => {
      chunks.push(chunk);
    });

    response.on('end', () => {
      const body = Buffer.concat(chunks).toString();
      res.status(200).json(JSON.parse(body));
    });
  });

  request.write(data);
  request.end();
}
