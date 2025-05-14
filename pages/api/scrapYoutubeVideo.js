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
        const apiUrl = "http://185.126.181.74:8000/api/scrap_youtube_video/?video_title=on&description=on";

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

        res.status(200).json(response.data);
    } catch (error) {
        console.error("Error fetching data:", error.message);
        res.status(500).json({ error: "Failed to fetch data from the API." });
    }
}
