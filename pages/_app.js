import { appWithTranslation } from "next-i18next";
import React, { useEffect, useState } from "react";
import Head from "next/head";
import Script from "next/script";
import "../styles/globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import Footer from "./Footer";
import Navbar from "./Navbar";
import { ContentProvider } from "../contexts/ContentContext";
import CookieConsent from "react-cookie-consent";
import Link from "next/link";
import { useRouter } from "next/router";
import "../public/laraberg.css";
import nextI18NextConfig from "../next-i18next.config";
import { UserActionProvider } from "../contexts/UserActionContext";

function MyApp({ Component, pageProps }) {
  const [tawkConfig, setTawkConfig] = useState(null);
  const [googleAnalyticsConfig, setGoogleAnalyticsConfig] = useState(null);
  const router = useRouter();

  // Fetch configurations from the /api/extensions endpoint
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const protocol =
          window.location.protocol === "https:" ? "https" : "http";
        const host = window.location.host;

        const response = await fetch(`${protocol}://${host}/api/extensions`);
        const result = await response.json();

        if (result.success) {
          // Tawk.to configuration
          const tawkExtension = result.data.find(
            (ext) => ext.key === "tawk_to" && ext.status === "Enabled"
          );
          if (tawkExtension && tawkExtension.config.appKey) {
            setTawkConfig(tawkExtension.config);
          }

          // Google Analytics configuration
          const googleAnalyticsExtension = result.data.find(
            (ext) =>
              ext.key === "google_analytics" && ext.status === "Enabled"
          );
          if (
            googleAnalyticsExtension &&
            googleAnalyticsExtension.config.measurementId
          ) {
            setGoogleAnalyticsConfig(
              googleAnalyticsExtension.config.measurementId
            );
          }
        }
      } catch (error) {
        console.error("Error fetching configurations:", error);
      }
    };

    fetchConfigs();
  }, []);

  // Dynamically add Tawk.to script
  useEffect(() => {
    if (tawkConfig && tawkConfig.appKey) {
      const Tawk_API = window.Tawk_API || {};
      const Tawk_LoadStart = new Date();
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
  }, [tawkConfig]);

  // Dynamically add Google Analytics script
  useEffect(() => {
    if (googleAnalyticsConfig) {
      const gtagScript = document.createElement("script");
      gtagScript.async = true;
      gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=G-2M8WVHZHLG`;
      document.head.appendChild(gtagScript);

      const inlineScript = document.createElement("script");
      inlineScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-2M8WVHZHLG');
      `;
      document.head.appendChild(inlineScript);

      return () => {
        if (gtagScript.parentNode) {
          document.head.removeChild(gtagScript);
        }
        if (inlineScript.parentNode) {
          document.head.removeChild(inlineScript);
        }
      };
    }
  }, [googleAnalyticsConfig]);

  return (
    <>
      <Head>
        <meta name="twitter:image" content={pageProps.meta?.image || ""} />
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="google-site-verification"
          content="_eXmkpaLA6eqmMTx8hVOZP1tF7-PZ9X8vIwkWxo8Po8"
        />
       


        <meta name="msvalidate.01" content="F2174449ED0353749E6042B4A2E43F09" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-2M8WVHZHLG"></script>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-2M8WVHZHLG');
              `,
            }}
          />
      </Head>

      <Script
        id="organization-schema"
        type="application/ld+json"
        strategy="lazyOnload"
      >
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
  
      <AuthProvider>
        <ContentProvider>
        <UserActionProvider>
          {!router.pathname.includes("/dashboard") && <Navbar />}
          <Component {...pageProps}  />
          {!router.pathname.includes("/dashboard") && <Footer />}
          </UserActionProvider>
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
          <span style={{ color: "#fff", textDecoration: "underline" }}>
            Learn more
          </span>
        </Link>
      </CookieConsent>
    </>
  );
}

export default appWithTranslation(MyApp, nextI18NextConfig);
