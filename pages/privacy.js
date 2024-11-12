
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import React from 'react';
import { i18n } from '../next-i18next.config'; // Adjust this import path based on your project structure

function Privacy({ existingContent, metaTitle, metaDescription, metaUrl, hreflangs }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-5">
      <Head>
        {/* SEO Meta Tags */}
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="index, follow" />

        {/* Canonical URL */}
        <link rel="canonical" href={metaUrl} />

        {/* Open Graph Meta Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={metaUrl} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content="/path/to/your/image.jpg" />
        <meta property="og:image:secure_url" content="/path/to/your/image.jpg" />
        <meta property="og:site_name" content="Ytubetools" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:domain" content={metaUrl
                .replace("/privacy", "")}
            />
        <meta property="twitter:url" content={metaUrl} />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content="/path/to/your/image.jpg" />
        <meta name="twitter:site" content="@ytubetools" />
        <meta name="twitter:image:alt" content="Description of the image" />

        {/* Alternate hreflang Tags for SEO */}
        {hreflangs.map((hreflang, index) => (
          <link
            key={index}
            rel="alternate"
            hreflang={hreflang.hreflang}
            href={hreflang.href}
          />
        ))}
      </Head>
      <div className="mt-10">
        <h1 className="text-center">Privacy & Policy</h1>
        <div dangerouslySetInnerHTML={{ __html: existingContent }} style={{ listStyleType: 'none' }}></div>
      </div>
    </div>
  );
}


export async function getServerSideProps({ req, locale }) {
  const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const host = req.headers.host || 'your-default-domain.com';
  const baseUrl = `${protocol}://${host}`;
  const privacyApiUrl = `${baseUrl}/api/privacy`;

  // Prepare hreflangs based on actual content availability
  const hreflangs = [];

  for (const lang of i18n.locales) {
    const url = `${privacyApiUrl}?lang=${lang}`;
    const response = await fetch(url);
    
    if (response.ok) {
      // If content exists for this language, add to hreflangs
      hreflangs.push({
        rel: "alternate",
        hreflang: lang,
        href: `${baseUrl}${lang === 'en' ? '/privacy' : `/${lang}/privacy`}`,
      });
    }
  }

  // Add x-default hreflang tag as a fallback
  hreflangs.unshift({
    rel: "alternate",
    hreflang: "x-default",
    href: `${baseUrl}/privacy`,
  });

  // Fetch the content for the requested locale
  const currentLocaleUrl = `${privacyApiUrl}?lang=${locale}`;
  const contentResponse = await fetch(currentLocaleUrl);
  const contentData = contentResponse.ok ? await contentResponse.json() : {};

  return {
    props: {
      existingContent: contentData.content || '',
      metaTitle: contentData.metaTitle || 'Default Title',
      metaDescription: contentData.metaDescription || 'Default description',
      metaUrl: `${baseUrl}${locale === 'en' ? '/privacy' : `/${locale}/privacy`}`,
      hreflangs,
      ...(await serverSideTranslations(locale, ['privacy', 'navbar', 'footer'])),
    },
  };
}

export default Privacy;
