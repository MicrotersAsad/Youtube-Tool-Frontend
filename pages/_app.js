// pages/_app.js

import { appWithTranslation } from 'next-i18next';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import '../styles/globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import Footer from './Footer'; // Adjust your path based on file structure
import Navbar from './Navbar';
import { ContentProvider } from '../contexts/ContentContext';
import CookieConsent from 'react-cookie-consent';
import Link from 'next/link';
import { useRouter } from 'next/router';
import '../public/laraberg.css';
import nextI18NextConfig from '../next-i18next.config'; // Import i18n config

function MyApp({ Component, pageProps }) {
  const [showButton, setShowButton] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceData, setMaintenanceData] = useState(null);
  const [headerContent, setHeaderContent] = useState(''); // State for header content
  const router = useRouter();

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const response = await fetch('/api/maintenance');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        if (data.status === 'enabled') {
          setIsMaintenance(true);
          setMaintenanceData({
            title: 'Maintenance Mode',
            description: data.description || 'The site is currently down for scheduled maintenance. Please check back later.',
            image: data.imageUrl || '/path-to-maintenance-image.png',
          });
        }
      } catch (error) {
        console.error('Error fetching maintenance status:', error);
      }
    };
    checkMaintenanceMode();
  }, []);

  // Fetch and apply header content from the API
  useEffect(() => {
    const fetchHeaderContent = async () => {
      const protocol = window.location.protocol;
      const host = window.location.host;

      try {
        const headerResponse = await fetch(`${protocol}//${host}/api/heading`);
        const headerData = await headerResponse.json();
        setHeaderContent(headerData[0]?.content || '');
        console.log(headerContent);
        
      } catch (error) {
        console.error('Error fetching header content:', error);
      }
    };

    fetchHeaderContent();
  }, []);

  // Inject fetched meta tags and scripts into the document head
  useEffect(() => {
    if (!headerContent) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(headerContent, 'text/html');

    // Add meta tags if they don't already exist
    const metaTags = doc.querySelectorAll('meta');
    metaTags.forEach((meta) => {
      if (!document.head.querySelector(`meta[content="${meta.getAttribute('content')}"]`)) {
        document.head.appendChild(meta.cloneNode(true));
      }
    });

    // Add script tags if they don't already exist
    const scriptTags = doc.querySelectorAll('script');
    scriptTags.forEach((script) => {
      if (script.src && !document.head.querySelector(`script[src="${script.src}"]`)) {
        const newScript = document.createElement('script');
        newScript.src = script.src;
        newScript.type = script.type || 'text/javascript';
        newScript.async = script.async || false;
        document.head.appendChild(newScript);
      } else if (!script.src) {
        const inlineScript = document.createElement('script');
        inlineScript.type = script.type || 'text/javascript';
        inlineScript.textContent = script.textContent;
        document.head.appendChild(inlineScript);
      }
    });
  }, [headerContent]);

  useEffect(() => {
    const handleScroll = () => setShowButton(window.scrollY > 300);
    const throttledHandleScroll = throttle(handleScroll, 200);
    window.addEventListener('scroll', throttledHandleScroll);

    return () => window.removeEventListener('scroll', throttledHandleScroll);
  }, []);

  const throttle = (func, delay) => {
    let timeout;
    return () => {
      if (!timeout) {
        func();
        timeout = setTimeout(() => {
          timeout = null;
        }, delay);
      }
    };
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hideHeaderFooter = router.pathname.includes('/dashboard');

  if (isMaintenance && !router.pathname.startsWith('/dashboard')) {
    return (
      <>
        <Head>
          <title>{maintenanceData?.title || 'Maintenance'}</title>
        </Head>
        <div className="min-h-screen flex flex-col justify-center items-center">
          <h1 className="text-4xl font-semibold mb-6">{maintenanceData?.title}</h1>
          <img src={maintenanceData?.image} alt="Maintenance" className="mb-6" style={{ width: '400px' }} />
          <p className="text-lg" dangerouslySetInnerHTML={{ __html: maintenanceData?.description }}></p>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <meta name="twitter:image" content={pageProps.meta?.image || ""} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Script
        id="organization-schema"
        type="application/ld+json"
        strategy="lazyOnload"
      >
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "YouTube Tools",
          "url": "http://www.ytubetools.com/",
          "logo": "https://yourwebsite.com/logo.png",
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+880 162-519-2766",
            "contactType": "Customer Service"
          },
          "sameAs": [
            "https://www.facebook.com/yourprofile",
            "https://www.twitter.com/yourprofile",
            "https://www.linkedin.com/in/yourprofile"
          ]
        })}
      </Script>

      <AuthProvider>
        <ContentProvider>
          {!hideHeaderFooter && <Navbar />}
          <Component {...pageProps} />
          {!hideHeaderFooter && <Footer />}
        </ContentProvider>
      </AuthProvider>

      <CookieConsent
        location="bottom"
        buttonText="I understand"
        cookieName="mySiteCookieConsent"
        style={{ background: "#2B373B", color: "#fff" }}
        buttonStyle={{ color: "#4e503b", fontSize: "13px" }}
        expires={150}
      >
        This website uses cookies to enhance the user experience.{" "}
        <Link href="/privacy" passHref>
          <span style={{ color: "#fff", textDecoration: 'underline' }}>Learn more</span>
        </Link>
      </CookieConsent>

      {showButton && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '50px',
            right: '50px',
            width: '50px',
            height: '50px',
            backgroundColor: 'red',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '20px',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          }}
        >
          ↑
        </button>
      )}
    </>
  );
}

export default appWithTranslation(MyApp, nextI18NextConfig);
