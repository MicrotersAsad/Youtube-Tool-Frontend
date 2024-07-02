import { getSubtitles } from 'youtube-captions-scraper';
import fetch from 'node-fetch';
import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} not allowed`);
  }

  const { videoUrl } = req.body;
  const videoId = new URLSearchParams(new URL(videoUrl).search).get('v');

  if (!videoId) {
    return res.status(400).json({ message: 'Invalid YouTube video URL' });
  }

  try {
    const { db } = await connectToDatabase();
    const youtubeTokens = await db.collection('ytApi').find({ active: true }).toArray();
    const openAiTokens = await db.collection('openaiKey').find({ active: true }).toArray();

    let captions, videoInfo;
    let youtubeApiKeyExhausted = false;

    // Loop through YouTube API keys
    for (const token of youtubeTokens) {
      const youtubeApiKey = token.token;

      try {
        captions = await getSubtitles({ videoID: videoId });

        const videoInfoUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${youtubeApiKey}&part=snippet,contentDetails`;
        const videoInfoResponse = await fetch(videoInfoUrl);
        const videoInfoData = await videoInfoResponse.json();

        if (!videoInfoData.items || videoInfoData.items.length === 0) {
          throw new Error('Video not found');
        }

        videoInfo = videoInfoData.items[0];
        break;
      } catch (error) {
        if (error.message.includes('Quota Exceeded')) {
          console.log(`Quota exceeded for YouTube API key: ${youtubeApiKey}`);
          continue;
        } else {
          console.error('Error fetching data:', error.message);
        }
      }
    }

    if (!videoInfo) {
      youtubeApiKeyExhausted = true;
      return res.status(500).json({ message: 'All YouTube API keys exhausted or error occurred' });
    }

    const duration = videoInfo.contentDetails.duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const videoDuration = `${duration[1] ? duration[1].slice(0, -1) + 'h ' : ''}${duration[2] ? duration[2].slice(0, -1) + 'm ' : ''}${duration[3] ? duration[3].slice(0, -1) + 's' : ''}`.trim();
    const totalDuration = captions[captions.length - 1].start + captions[captions.length - 1].dur;
    const segmentDuration = 60;
    let segments = [];
    let currentSegment = [];
    let currentTime = 0;

    captions.forEach(caption => {
      const captionEndTime = caption.start + caption.dur;
      if (captionEndTime > currentTime + segmentDuration) {
        segments.push(currentSegment);
        currentSegment = [];
        currentTime += segmentDuration;
      }
      currentSegment.push(caption);
    });

    if (currentSegment.length) {
      segments.push(currentSegment);
    }

    const summaries = await Promise.all(segments.map(async segment => {
      const transcript = segment.map(caption => caption.text).join(' ');

      let openAiKeyExhausted = false;

      for (const token of openAiTokens) {
        const openAiKey = token.token;

        try {
          const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openAiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [{ role: "user", content: `Summarize the following transcript: ${transcript}` }],
              temperature: 0.7,
            }),
          });
          const data = await response.json();

          // Improved error handling for OpenAI API response
          if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
            console.error('Invalid response format from OpenAI API:', data);
            continue;
          }

          return data.choices[0].message.content;
        } catch (error) {
          if (error.message.includes('quota')) {
            console.log(`Quota exceeded for OpenAI API key: ${openAiKey}`);
            continue;
          } else {
            console.error('Error summarizing segment:', error.message);
            throw new Error('Failed to summarize video');
          }
        }
      }

      openAiKeyExhausted = true;
      throw new Error('All OpenAI API keys exhausted or error occurred');
    }));

    res.status(200).json({
      videoInfo: {
        title: videoInfo.snippet.title,
        author: videoInfo.snippet.channelTitle,
        duration: videoDuration,
        readTime: `${Math.ceil(totalDuration / 60)} min`,
        thumbnail: videoInfo.snippet.thumbnails.high.url,
        publishedAt: videoInfo.snippet.publishedAt,
      },
      captions: segments,
      summaries
    });
  } catch (error) {
    if (youtubeApiKeyExhausted || error.message.includes('All OpenAI API keys exhausted or error occurred')) {
      console.error('All keys exhausted:', error.message);
      return res.status(500).json({ message: 'All API keys exhausted or error occurred' });
    } else {
      console.error('Error summarizing video:', error.message);
      return res.status(500).json({ message: 'Error summarizing video' });
    }
  }
}
