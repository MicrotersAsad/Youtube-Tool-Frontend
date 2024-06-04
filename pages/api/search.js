// pages/api/search.js
export default function handler(req, res) {
  const { query } = req.query;

  // Example static data; replace with your actual search logic
  const data = [
    { id: 1, title: 'Tag Generator', description: 'Generate tags for YouTube videos', href: '/tools/tagGenerator' },
    { id: 2, title: 'Title & Description Generator', description: 'Generate titles and descriptions for YouTube videos', href: '/tools/youtube-title-and-description-generator' },
    { id: 3, title: 'Tag Extractor', description: 'Tag Extract From Youtube Videos', href: '/tools/tagExtractor' },
    { id: 4, title: 'Title & Description Generator', description: 'Generate titles and descriptions for YouTube videos', href: '/tools/youtube-title-and-description-generator' },
    { id: 5, title: 'Title & Description Generator', description: 'Generate titles and descriptions for YouTube videos', href: '/tools/youtube-title-and-description-generator' },
    { id: 6, title: 'Title & Description Generator', description: 'Generate titles and descriptions for YouTube videos', href: '/tools/youtube-title-and-description-generator' },
    { id: 7, title: 'Title & Description Generator', description: 'Generate titles and descriptions for YouTube videos', href: '/tools/youtube-title-and-description-generator' },
    // Add more items as needed
  ];

  const results = data.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase())
  );

  res.status(200).json({ results });
}
