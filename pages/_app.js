import { appWithTranslation } from "next-i18next";
import React, { useState, useEffect } from "react";
import Head from "next/head";
import Script from "next/script";
import "../styles/globals.css";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import Footer from "./Footer";
import Navbar from "./Navbar";
import { ContentProvider } from "../contexts/ContentContext";
import CookieConsent from "react-cookie-consent";
import Link from "next/link";
import { useRouter } from "next/router";
import "../public/laraberg.css";
import nextI18NextConfig from "../next-i18next.config";
import { UserActionProvider } from "../contexts/UserActionContext";

// Component to handle app content and scripts
function AppContent({ Component, pageProps }) {
  const [tawkConfig, setTawkConfig] = useState(null);
  const [googleAnalyticsConfig, setGoogleAnalyticsConfig] = useState(null);
  const router = useRouter();
  const isDashboard = router.asPath.startsWith("/dashboard");

  // Fetch configuration settings
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const protocol = window.location.protocol;
        const host = window.location.host;
        const res = await fetch(`${protocol}//${host}/api/extensions`);
        const result = await res.json();

        if (result.success) {
          const tawk = result.data.find(
            (ext) => ext.key === "tawk_to" && ext.status === "Enabled"
          );
          if (tawk?.config?.appKey) {
            setTawkConfig(tawk.config);
          }

          const ga = result.data.find(
            (ext) => ext.key === "google_analytics" && ext.status === "Enabled"
          );
          if (ga?.config?.measurementId) {
            setGoogleAnalyticsConfig(ga.config.measurementId);
          }
        }
      } catch (err) {
        console.error("Error fetching configs:", err);
      }
    };

    fetchConfigs();
  }, []);

  // Load Tawk.to script
  useEffect(() => {
    if (tawkConfig?.appKey && !isDashboard) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://embed.tawk.to/${tawkConfig.appKey}/1id6uh68m`;
      script.charset = "UTF-8";
      script.setAttribute("crossorigin", "*");
      document.body.appendChild(script);

      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
  }, [tawkConfig, isDashboard]);

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="twitter:image" content={pageProps.meta?.image || ""} />
        <meta
          name="google-site-verification"
          content="_eXmkpaLA6eqmMTx8hVOZP1tF7-PZ9X8vIwkWxo8Po8"
        />
        <meta
          name="msvalidate.01"
          content="F2174449ED0353749E6042B4A2E43F09"
        />
      </Head>

      {/* Google Analytics */}
      {!isDashboard && googleAnalyticsConfig && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsConfig}`}
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${googleAnalyticsConfig}');
            `}
          </Script>
        </>
      )}

      {/* Google Ads */}
      {!isDashboard && (
        <Script
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2198018529886749"
          crossOrigin="anonymous"
        />
      )}

      {/* Schema Markup */}
      <Script id="organization-schema" type="application/ld+json" strategy="lazyOnload">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "YouTube Tools",
          url: "http://www.ytubetools.com/",
          logo: "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1733391907509-yticon.png",
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+13072255635",
            contactType: "Customer Service",
          },
          sameAs: [
            "https://www.facebook.com/ytubetools",
            "https://www.linkedin.com/company/ytubetools",
          ],
        })}
      </Script>

      {!isDashboard && <Navbar />}
      <Component {...pageProps} />
      {!isDashboard && <Footer />}

      {/* Cookie Consent */}
      {!isDashboard && (
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
            <span style={{ color: "#fff", textDecoration: "underline" }}>
              Learn more
            </span>
          </Link>
        </CookieConsent>
      )}
    </>
  );
}

// Component to handle authentication checks
function AuthWrapper({ Component, pageProps }) {
  const { user, loading } = useAuth(); // Now safe to use inside AuthProvider
  const router = useRouter();
  const isDashboard = router.asPath.startsWith("/dashboard");

  useEffect(() => {
    if (isDashboard && !loading && !user) {
      router.push("/login");
    }
  }, [isDashboard, user, loading, router]);

  return <AppContent Component={Component} pageProps={pageProps} />;
}

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <ContentProvider>
        <UserActionProvider>
          <AuthWrapper Component={Component} pageProps={pageProps} />
        </UserActionProvider>
      </ContentProvider>
    </AuthProvider>
  );
}

export default appWithTranslation(MyApp, nextI18NextConfig);