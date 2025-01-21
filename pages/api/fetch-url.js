// import fetch from 'node-fetch';
// import { connectToDatabase } from '../../utils/mongodb';

// export default async function handler(req, res) {
//   // Only allow POST requests
//   if (req.method !== 'POST') {
//     res.setHeader('Allow', ['POST']);
//     return res.status(405).end(`Method ${req.method} not allowed`);
//   }

//   // Extract the video URL from the request body
//   const { videoUrl } = req.body;
//   // Parse the video ID from the YouTube URL
//   const videoId = new URLSearchParams(new URL(videoUrl).search).get('v');

//   // Check if video ID is valid
//   if (!videoId) {
//     return res.status(400).json({ message: 'Invalid YouTube video URL' });
//   }

//   try {
//     // Connect to the MongoDB database
//     const { db } = await connectToDatabase();
//     // Fetch all active API tokens from the collection
//     const tokens = await db.collection('ytApi').find({ active: true }).toArray();
    
//     // Loop through each token to make the API call
//     for (const token of tokens) {
//       const apiKey = token.token; // Extract the API key
//       try {
//         // Construct the YouTube API URL with the video ID and API key
//         const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`;
//         const response = await fetch(url); // Fetch data from the YouTube API
//         const data = await response.json();

//         // Check if the response is successful and contains video data
//         if (response.ok && data.items && data.items.length > 0) {
//           const tags = data.items[0].snippet.tags || []; // Extract tags from the video data
//           return res.status(200).json({ tags }); // Return the tags
//         } else {
//           // Handle case where the quota is exceeded for the current API key
//           if (data.error && data.error.errors[0].reason === 'quotaExceeded') {
//             console.log(`Quota exceeded for API key: ${apiKey}`);
//             continue; // Try the next API key
//           }
//           throw new Error('Failed to fetch video tags'); // Throw an error for other failures
//         }
//       } catch (error) {
//         console.error('Error fetching video tags:', error.message);
//         continue; // Move to the next API key in case of an error
//       }
//     }

//     // If all API keys are exhausted or an error occurs
//     res.status(500).json({ message: 'All API keys exhausted or error occurred' });
//   } catch (error) {
//     console.error('Database error:', error.message);
//     res.status(500).json({ message: 'Database connection error' });
//   }
// }



// //import fetch from 'node-fetch';
// import { connectToDatabase } from '../../utils/mongodb';

// export default async function handler(req, res) {
//   // Only allow POST requests
//   if (req.method !== 'POST') {
//     res.setHeader('Allow', ['POST']);
//     return res.status(405).end(`Method ${req.method} not allowed`);
//   }

//   // Extract the video URL from the request body
//   const { videoUrl } = req.body;

//   // Validate the video URL
//   if (!videoUrl || !/^https?:\/\/(www\.)?youtube\.com\/watch\?v=|youtu\.be\//.test(videoUrl)) {
//     return res.status(400).json({ message: 'Invalid YouTube video URL' });
//   }

//   try {
//     // Connect to the MongoDB database
//     const { db } = await connectToDatabase();

//     // Construct the API payload
//     const apiPayload = {
//       urls: [videoUrl]
//     };

//     // Call the external API
//     const response = await fetch(
//       `http://166.0.175.238:8000/api/scrap_youtube_video/?video_title=on&description=on&total_likes=off&comments=on&video_views=on&upload_date=on&video_duration=on&video_thumbnail=on&channel_url=on&video_id=on&total_subscribers=on&verified=on&latest_comments=on&transcripts=on`,
//       {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(apiPayload)
//       }
//     );

//     const data = await response.json();

//     // Check if the response is successful
//     if (response.ok) {
//       return res.status(200).json(data); // Return the fetched data
//     } else {
//       console.error('Error fetching video data:', data.message || 'Unknown error');
//       return res.status(500).json({ message: data.message || 'Error fetching video data' });
//     }
//   } catch (error) {
//     console.error('Error calling the API:', error.message);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// }
