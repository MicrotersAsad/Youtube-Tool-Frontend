import Cors from 'cors';

const cors = Cors({
  origin: '*',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
});

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  await runMiddleware(req, res, cors);

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tags, selectedLanguage, selectedTone, serviceType, token, url } = req.body;

  if (!tags || !serviceType || !token || !url) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    let headers = {};
    let body = {};

    if (serviceType === 'openai') {
      headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.trim()}`,
      };
      body = {
         model:"gemini-3.1-flash-lite-preview-thinking",
        messages: [
          {
            role: 'system',
            content: `Generate a list of at least 10 SEO-friendly Titles for keywords: "${tags.join(', ')}" in this ${selectedTone} tone & language ${selectedLanguage}.`,
          },
          { role: 'user', content: tags.join(', ') },
        ],
        temperature: 0.7,
        max_tokens: 8192,
        stream: false,
      };
    } else if (serviceType === 'azure') {
      headers = {
        'Content-Type': 'application/json',
        'api-key': token.trim(),
      };
      body = {
        messages: [
          {
            role: 'system',
            content: `Generate a list of at least 10 SEO-friendly Titles for keywords: "${tags.join(', ')}" in this language ${selectedLanguage}.`,
          },
          { role: 'user', content: tags.join(', ') },
        ],
        temperature: 1,
        max_tokens: 4096,
        top_p: 1,
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
      };
    } else {
      return res.status(400).json({ error: 'Unknown serviceType' });
    }

    const externalRes = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const contentType = externalRes.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await externalRes.text();
      console.error('Non-JSON response:', text);
      return res.status(500).json({ error: 'External API returned non-JSON response' });
    }

    const data = await externalRes.json();

    if (!externalRes.ok) {
      return res.status(externalRes.status).json({ error: data?.error || 'External API error' });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('Generate titles error:', err);
    return res.status(500).json({ error: err.message });
  }
}