import fetch from "node-fetch";
import { connectToDatabase } from "../../utils/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} not allowed`);
  }

  const { videoUrl } = req.body;
  const videoId = new URLSearchParams(new URL(videoUrl).search).get("v");

  if (!videoId) {
    return res.status(400).json({ message: "Invalid YouTube video URL" });
  }

  try {
    const { db } = await connectToDatabase();
    const tokens = await db
      .collection("ytApi")
      .find({ active: true })
      .toArray();

    for (const token of tokens) {
      const apiKey = token.token;
      try {
        const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails,statistics`;
        const response = await fetch(url);
        const data = await response.json();
        console.log(data);

        if (response.ok && data.items && data.items.length > 0) {
          const video = data.items[0];

          return res.status(200).json({
            title: video.snippet.title,
            description: video.snippet.description,
            thumbnail: video.snippet.thumbnails.high.url,
            publishedAt: video.snippet.publishedAt,
            channelTitle: video.snippet.channelTitle,
            viewCount: video.statistics.viewCount,
            likeCount: video.statistics.likeCount,
            dislikeCount: video.statistics.dislikeCount,
            commentCount: video.statistics.commentCount,
            duration: video.contentDetails.duration,
            tags: video.snippet.tags,
            defaultLanguage: video?.defaultLanguage,
            categoryId: video?.categoryId,
          });
        } else if (
          data.error &&
          data.error.errors[0].reason === "quotaExceeded"
        ) {
          console.log(`Quota exceeded for API key: ${apiKey}`);
          continue;
        } else {
          throw new Error("Failed to fetch video data");
        }
      } catch (error) {
        console.error("Error fetching video data:", error.message);
        continue;
      }
    }

    res
      .status(500)
      .json({ message: "All API keys exhausted or error occurred" });
  } catch (error) {
    console.error("Database error:", error.message);
    res.status(500).json({ message: "Database connection error" });
  }
}
