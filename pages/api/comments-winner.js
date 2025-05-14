// // pages/api/comments.js
// import fetch from 'node-fetch';
// import { connectToDatabase } from '../../utils/mongodb';

// export default async function handler(req, res) {
//   if (req.method !== 'GET') {
//     res.setHeader('Allow', ['GET']);
//     return res.status(405).end(`Method ${req.method} not allowed`);
//   }

//   const { videoId, includeReplies } = req.query;

//   if (!videoId) {
//     return res.status(400).json({ message: 'Video ID is required' });
//   }

//   try {
//     const { db } = await connectToDatabase();
//     const tokens = await db.collection('ytApi').find({ active: true }).toArray();

//     for (const token of tokens) {
//       const apiKey = token.token;
//       let url = `https://www.googleapis.com/youtube/v3/commentThreads?key=${apiKey}&textFormat=plainText&part=snippet,replies&videoId=${videoId}&maxResults=100`;

//       const comments = [];
//       let nextPageToken = null;

//       do {
//         const response = await fetch(`${url}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`);
//         const data = await response.json();

//         if (!response.ok || !data.items) {
//           if (data.error?.errors[0]?.reason === 'quotaExceeded') {
//             console.log(`Quota exceeded for API key: ${apiKey}`);
//             break; // Try the next API key
//           } else {
//             throw new Error('Failed to fetch comments');
//           }
//         }

//         data.items.forEach(item => {
//           comments.push({
//             user: item.snippet.topLevelComment.snippet.authorDisplayName,
//             avatar: item.snippet.topLevelComment.snippet.authorProfileImageUrl,
//             text: item.snippet.topLevelComment.snippet.textDisplay,
//             likes: item.snippet.topLevelComment.snippet.likeCount,
//             replies: item.snippet.totalReplyCount,
//             channelUrl: item.snippet.topLevelComment.snippet.authorChannelUrl,
//           });

//           if (includeReplies && item.replies) {
//             item.replies.comments.forEach(reply => {
//               comments.push({
//                 user: reply.snippet.authorDisplayName,
//                 avatar: reply.snippet.authorProfileImageUrl,
//                 text: reply.snippet.textDisplay,
//                 likes: reply.snippet.likeCount,
//                 replies: 0,
//               });
//             });
//           }
//         });

//         nextPageToken = data.nextPageToken;
//       } while (nextPageToken);

//       if (comments.length > 0) {
//         res.status(200).json(comments);
//         return;
//       }
//     }

//     res.status(500).json({ message: 'All API keys exhausted or error occurred' });
//   } catch (error) {
//     console.error('Error fetching comments:', error.message);
//     res.status(500).json({ message: 'Error fetching comments' });
//   }
// }
// import axios from 'axios';
// import https from 'https';

// export default async function handler(req, res) {
//   // Allow only POST requests
//   if (req.method !== 'POST') {
//     res.setHeader('Allow', ['POST']);
//     return res.status(405).json({ message: `Method ${req.method} not allowed` });
//   }

//   const { videoUrl } = req.body;

//   // Validate the video URL
//   if (!videoUrl) {
//     return res.status(400).json({ message: 'Video URL is required' });
//   }

//   try {
//     // External API endpoint
//     const url = `http://185.126.181.74:8000/api/scrap_youtube_video/?latest_comments=on`
//     // Make the POST request to the external API
//     const response = await axios.post(
//       url,
//       { urls: [videoUrl] }, // Pass the video URL in the request body
//       {
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         httpsAgent: new https.Agent({
//           rejectUnauthorized: false, // Disable SSL verification
//         }),
//       }
//     );

//     // Extract and validate the response data
//     const data = response.data;
//     console.log(data);
    

//     if (!data.latest_comments || data.latest_comments.length === 0) {
//       return res.status(404).json({ message: 'No comments available' });
//     }
// console.log(data.latest_comments);

//     // Respond with the extracted comments
//     return res.status(200).json(data.latest_comments);
//   } catch (error) {
//     console.error('Error in /api/commentswinner:', error.message);

//     // Handle errors and return an appropriate response
//     return res.status(500).json({
//       message: 'Internal Server Error',
//       error: error.response?.data || error.message,
//     });
//   }
// }
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
        const apiUrl = "http://185.126.181.74:8000/api/scrap_youtube_video/?latest_comments=on";

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
