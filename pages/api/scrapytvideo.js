import axios from "axios";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { videoUrl } = req.body;

    if (!videoUrl) {
        return res.status(400).json({ error: "Video URL is required" });
    }

    try {
        // Custom API URL
        const apiUrl = "http://166.0.175.238:8000/api/scrap_youtube_video/?video_title=on&description=on&total_likes=off&comments=on&video_views=on&upload_date=on&video_duration=on&video_thumbnail=on&channel_url=on&video_id=on&total_subscribers=on&verified=on";

        // Disable SSL verification using axios
        const response = await axios.post(apiUrl, {
            urls: [videoUrl],
        }, {
            headers: {
                "Content-Type": "application/json",
            },
            httpsAgent: new (require("https").Agent)({
                rejectUnauthorized: false, // Disable SSL verification
            }),
        });
console.log(response);

        res.status(200).json(response.data);
    } catch (error) {
        console.error("Error fetching data:", error.message);
        res.status(500).json({ error: "Failed to fetch data from the API." });
    }
}
