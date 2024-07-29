import { useEffect, useState } from 'react';
import Head from 'next/head';
import '../styles/globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import Footer from './Footer';
import Navbar from './Navbar';
import { appWithTranslation } from 'next-i18next';
import 'react-quill/dist/quill.snow.css';

function MyApp({ Component, pageProps }) {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const logVisit = async () => {
      try {
        await fetch('/api/log-visit', {
          method: 'POST',
        });
      } catch (error) {
        console.error('Error logging site visit:', error);
      }
    };

    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowButton(true);
      } else {
        setShowButton(false);
      }
    };

    const throttledHandleScroll = throttle(handleScroll, 200);

    window.addEventListener('scroll', throttledHandleScroll);
    logVisit();

    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
    };
  }, []);

  const throttle = (func, delay) => {
    let timeout;
    return () => {
      if (!timeout) {
        timeout = setTimeout(() => {
          timeout = null;
          func();
        }, delay);
      }
    };
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Head>
        <meta name="twitter:image" content={pageProps.meta?.image || ""} />
        <link rel="icon" href="/favicon.ico" />
      
        <script type="application/ld+json">
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
        </script>
      </Head>
     
      <AuthProvider>
        <Navbar />
        <Component {...pageProps} />
        <Footer />
      </AuthProvider>

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

export default appWithTranslation(MyApp);
