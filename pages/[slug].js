import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PageHeader from '../components/PageHeader';
import Head from 'next/head';
import Skeleton from 'react-loading-skeleton'; // Import Skeleton for loading state
import 'react-loading-skeleton/dist/skeleton.css'; // Skeleton CSS
import DOMPurify from 'dompurify';

// Function to decode HTML entities and remove unwanted ones
function cleanHTML(input) {
  if (typeof document !== 'undefined') { // Check if running on the client side
    // Decode HTML entities using a temporary textarea element
    const textArea = document.createElement('textarea');
    textArea.innerHTML = input;
    let decodedString = textArea.value;

    // Remove unwanted HTML entities and tags
    decodedString = decodedString.replace(/<br\s*\/?>/gi, ''); // Remove <br> and <br/>
    decodedString = decodedString.replace(/&nbsp;/gi, ' '); // Replace &nbsp; with a space
    // Clean up HTML comments if there are any (<!-- -->)
    decodedString = decodedString.replace(/<!--.*?-->/g, ''); // Remove HTML comments

    // Sanitize the decoded string to remove any remaining unwanted tags and attributes
    const sanitizedContent = DOMPurify.sanitize(decodedString, {
      ADD_TAGS: ['style', 'script'],  // Allow style and script tags (with caution)
      ADD_ATTR: ['class', 'id', 'src', 'href', 'style'], // Allow specific attributes
    });

    return sanitizedContent;
  }

  // If document is not available, return the input as it is (SSR safe fallback)
  return input;
}

const ViewPage = ({ pageData, error }) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleRouteChangeStart = () => {
      setLoading(true);
    };

    const handleRouteChangeComplete = () => {
      setLoading(false);
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router]);

  // Inject and execute script tags
  useEffect(() => {
    if (typeof document !== 'undefined' && pageData && pageData.content) {
      const contentContainer = document.querySelector('.content-container');

      if (contentContainer) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(pageData.content, 'text/html');
        contentContainer.innerHTML = doc.body.innerHTML;

        // Find and execute all script tags manually
        const scriptTags = contentContainer.querySelectorAll('script');
        scriptTags.forEach((oldScript) => {
          const newScript = document.createElement('script');
          if (oldScript.src) {
            newScript.src = oldScript.src;
          } else {
            newScript.innerHTML = oldScript.innerHTML;
          }
          document.body.appendChild(newScript); // Append new script to body for execution
        });
      }
    }
  }, [pageData]);

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">Error: {error}</div>
    );
  }

  if (loading || !pageData) {
    return (
      <div className="max-w-7xl mx-auto p-4 mt-5 mb-5">
        <Skeleton height={50} width={300} className="mb-4" />
        <Skeleton height={30} count={5} className="mb-2" />
        <Skeleton height={400} />
      </div>
    );
  }

  // Clean and sanitize the content
  const sanitizedContent = cleanHTML(pageData.content);

  return (
    <>
      <Head>
        <title>{pageData.metaTitle || pageData.name}</title>
        <meta name="description" content={pageData.metaDescription} />
        {pageData.metaImage && (
          <>
            <meta property="og:image" content={pageData.metaImage} />
            <meta name="twitter:image" content={pageData.metaImage} />
          </>
        )}
        <meta property="og:title" content={pageData.metaTitle || pageData.name} />
        <meta property="og:description" content={pageData.metaDescription} />
        <meta name="twitter:title" content={pageData.metaTitle || pageData.name} />
        <meta name="twitter:description" content={pageData.metaDescription} />
      </Head>

      <PageHeader
        title={pageData.name}
        breadcrumb={[
          { label: 'Home', link: '/' },
          { label: `${pageData.name}` },
        ]}
      />
      <div className="max-w-7xl mx-auto p-4 mt-5 mb-5">
        {/* Render sanitized content */}
        <div
          className="content-container mb-8"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      </div>
    </>
  );
};

// Fetching data server-side using req.headers to construct the base URL
export async function getServerSideProps(context) {
  const { slug } = context.query;
  const { req } = context;
  let pageData = null;
  let error = null;

  try {
    const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.headers.host;

    const pageResponse = await fetch(`${protocol}://${host}/api/pages?slug=${slug}`, {
      headers: {
        Authorization: req.headers.authorization || '',
      },
    });

    if (!pageResponse.ok) {
      throw new Error('Failed to fetch page data');
    }

    pageData = await pageResponse.json();
  } catch (err) {
    error = err.message;
  }

  return {
    props: {
      pageData,
      error,
    },
  };
}

export default ViewPage;
