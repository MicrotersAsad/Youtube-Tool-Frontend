import axios from "axios";
import https from "https";

export default async function handler(req, res) {
    // Allow only POST requests
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Extract videoUrl from the request body
    const { videoUrl } = req.body;

    if (!videoUrl) {
        return res.status(400).json({ error: "Video URL is required" });
    }

    try {
        // Custom API URL to fetch channel_logo
        const apiUrl = "http://185.126.181.74:8000/api/scrap_youtube_channel/?channel_logo=on";

        // Send request to the external API with SSL verification disabled
        const response = await axios.post(
            apiUrl,
            {
                urls: [videoUrl], // Pass the video URL
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false, // Disable SSL verification
                }),
            }
        );

        // Return the fetched data as response
        res.status(200).json(response.data);
    } catch (error) {
        console.error("Error fetching data:", error.message);

        // Handle errors gracefully
        res.status(500).json({
            error: "Failed to fetch data from the API.",
            message: error.message,
        });
    }
}
