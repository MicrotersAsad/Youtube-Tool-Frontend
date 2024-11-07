// pages/_app.js

import { appWithTranslation } from 'next-i18next';
import { useEffect } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import '../styles/globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import Footer from './Footer';
import Navbar from './Navbar';
import { ContentProvider } from '../contexts/ContentContext';
import CookieConsent from 'react-cookie-consent';
import Link from 'next/link';
import { useRouter } from 'next/router';
import '../public/laraberg.css';
import nextI18NextConfig from '../next-i18next.config';

function MyApp({ Component, pageProps }) {
  const { headerContent } = pageProps; // Access headerContent from props
  const router = useRouter();

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

  return (
    <>
      <Head>
        <meta name="twitter:image" content={pageProps.meta?.image || ""} />
        <link rel="icon" href="/favicon.ico" />
        <meta name="google-site-verification" content="_eXmkpaLA6eqmMTx8hVOZP1tF7-PZ9X8vIwkWxo8Po8" />


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
          {!router.pathname.includes('/dashboard') && <Navbar />}
          <Component {...pageProps} />
          {!router.pathname.includes('/dashboard') && <Footer />}
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
    </>
  );
}

export default appWithTranslation(MyApp, nextI18NextConfig);
