import fetch from 'node-fetch';
import { connectToDatabase } from '../../utils/mongodb';
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
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} not allowed`);
  }

  const { videoUrl } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ message: 'Invalid YouTube video URL' });
  }

  try {
    const { db } = await connectToDatabase();
    const apiTokens = await db.collection('openaiKey').find({ active: true }).toArray();

    const scrapApiUrl = `http://185.126.181.74:8000/api/scrap_youtube_video/?video_title=on&description=on&total_likes=off&comments=on&video_views=on&upload_date=on&video_duration=on&video_thumbnail=on&channel_url=on&video_id=on&total_subscribers=on&verified=on&latest_comments=on&transcripts=on`;

    const scrapResponse = await fetch(scrapApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: [videoUrl] }),
    });

    if (!scrapResponse.ok) {
      throw new Error('Failed to scrap video data from the external API');
    }

    const scrapData = await scrapResponse.json();
    const videoData = scrapData[videoUrl];

    if (!videoData) {
      return res.status(404).json({ message: 'No data found for the given video URL' });
    }

    const { transcripts, video_title, description, video_duration, video_thumbnail, upload_date, channel_url, video_id } = videoData;

    if (!transcripts || typeof transcripts["en"] !== 'string') {
      throw new Error('Transcripts not available or in an unexpected format for this video');
    }

    const fullTranscript = transcripts["en"];
    const transcriptSegments = [];
    const words = fullTranscript.split(" ");
    const segmentWordLimit = 200;
    let currentSegment = [];

    words.forEach((word) => {
      currentSegment.push(word);
      if (currentSegment.length >= segmentWordLimit) {
        transcriptSegments.push(currentSegment.join(" "));
        currentSegment = [];
      }
    });

    if (currentSegment.length > 0) {
      transcriptSegments.push(currentSegment.join(" "));
    }

    const summaries = await Promise.all(
      transcriptSegments.map(async (segmentText) => {
        for (const token of apiTokens) {
          const { token: apiKey, serviceType } = token;

          let url = '';
          let headers = {};
          let body = {};

          if (serviceType === 'openai') {
            url = 'https://api.oxyy.ai/v1/chat/completions';
            headers = {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey.trim()}`, // ✅ trim()
            };
            body = JSON.stringify({
              model: 'gemini-3.1-flash-lite-preview-thinking', // ✅ সঠিক model
              messages: [
                { role: 'user', content: `Summarize the following transcript: ${segmentText}` },
              ],
              temperature: 0.7,
              max_tokens: 8192, // ✅ সঠিক max_tokens
              stream: false,
            });
          } else if (serviceType === 'azure') {
            url = 'https://nazmul.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-08-01-preview';
            headers = {
              'Content-Type': 'application/json',
              'api-key': apiKey.trim(), // ✅ trim()
            };
            body = JSON.stringify({
              messages: [
                { role: 'user', content: `Summarize the following transcript: ${segmentText}` },
              ],
              temperature: 1,
              max_tokens: 4096,
              top_p: 1,
              frequency_penalty: 0.5,
              presence_penalty: 0.5,
            });
          }

          try {
            const summaryResponse = await fetch(url, {
              method: 'POST',
              headers,
              body,
            });

            const summaryData = await summaryResponse.json();

            if (summaryData.choices && summaryData.choices[0].message.content) {
              return summaryData.choices[0].message.content;
            }
          } catch (error) {
            console.warn(`Error summarizing segment with ${serviceType} key:`, error.message);
            continue;
          }
        }

        throw new Error('All summarization API keys exhausted');
      })
    );

    res.status(200).json({
      videoInfo: {
        video_title,
        description,
        videoId: video_id,
        thumbnail: video_thumbnail,
        duration: video_duration,
        uploadDate: upload_date,
        channelUrl: channel_url,
      },
      transcripts: transcriptSegments,
      summaries,
    });

  } catch (error) {
    console.error('Error processing video:', error.message);
    res.status(500).json({ message: error.message || 'An error occurred while processing the video' });
  }
}