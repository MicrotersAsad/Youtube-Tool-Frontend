import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';

const RelatedArticles = ({ category }) => {
  const [relatedArticles, setRelatedArticles] = useState([]);

  useEffect(() => {
    const fetchRelatedArticles = async () => {
      try {
        const response = await axios.get(`/api/blog?category=${category}`);
        setRelatedArticles(response.data);
      } catch (error) {
        console.error('Error fetching related articles:', error);
      }
    };

    if (category) {
      fetchRelatedArticles();
    }
  }, [category]);

  if (relatedArticles.length === 0) {
    return null;
  }

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatedArticles.map((article) => (
          <div key={article._id} className="bg-white shadow-md rounded-lg overflow-hidden">
            <Image src={article.image || '/default-image.jpg'} alt={article.title} width={400} height={250} className="object-cover" />
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">
                <Link href={`/blog/${article._id}`} className="text-blue-500 hover:underline">
                  {article.Blogtitle}
                </Link>
              </h3>
              <p className="text-gray-600 mb-4">{article.description}</p>
              <p className="text-gray-500 text-sm">By {article.author} · {new Date(article.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedArticles;
