import { useEffect, useState } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import '../styles/globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import Footer from './Footer';
import Navbar from './Navbar';
import { appWithTranslation } from 'next-i18next';
import { ContentProvider } from '../contexts/ContentContext';
import CookieConsent from 'react-cookie-consent';
import Link from 'next/link';
import { useRouter } from 'next/router';
import '../public/laraberg.css';

function MyApp({ Component, pageProps }) {
  const [showButton, setShowButton] = useState(false);
  const router = useRouter();

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

  const hideHeaderFooter = router.pathname.includes('/dashboard');

  return (
    <>
      <Head>
        <meta name="twitter:image" content={pageProps.meta?.image || ""} />
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css"
          integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC"
          crossOrigin="anonymous"
        />
      </Head>

      {/* Move all <Script /> components here outside of <Head /> */}
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
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js" />
      <Script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js" />
      <Script src="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.js" />

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
        <Link href="/privacy" style={{ color: "#fff", textDecoration: 'underline' }}>
          Learn more
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

export default appWithTranslation(MyApp);
