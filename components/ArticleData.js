import React, { useEffect, useState } from 'react';

const ArticleData = () => {
    const [article,setArticle]=useState([])
    const fetchArticles = async (page = 1) => {
        setLoading(true);
        try {
          const token = 'fc905a5a5ae08609ba38b046ecc8ef00'; // Example token
        
          if (!token) {
            console.error('Authorization token is missing.');
            return;
          }
      
          const response = await fetch(`/api/youtube?page=${page}&limit=${articlesPerPage}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
      
          if (!response.ok) throw new Error('Failed to fetch articles');
      
          const responseData = await response.json();
          if (Array.isArray(responseData.data)) {
            setArticle(responseData.meta.totalBlogs);
            
          } else {
            setArticle(0);
            
          }
        } catch (error) {
          console.error('Error fetching articles:', error.message);
          toast.error('Failed to load articles. Please try again later.');
          setArticle(0);
        
        }
        setLoading(false);
      };
      
    return (
        <div>
            
        </div>
    );
};

export default ArticleData;