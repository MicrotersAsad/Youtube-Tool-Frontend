import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "react-i18next";
import TagGenerator from "./tools/tagGenerator";
import styles from "../styles/Home.module.css";

export default function Home({ meta }) {
  const { t } = useTranslation("common");

  return (
    <div className={styles.container}>
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description}/>
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:image" content={meta.image} />
        <meta property="og:url" content={meta.url} />
        <meta name="twitter:card" ccontent={meta.image}/>
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.image} />
      </Head>
      <main className={styles.main}>
        <TagGenerator initialMeta={meta} />
      </main>
    </div>
  );
}

export async function getStaticProps({ locale }) {
  const host = process.env.HOST || "localhost:3000";
  const protocol = process.env.PROTOCOL || "http";
  const apiUrl = `${protocol}://${host}/api/content?category=tagGenerator&language=${locale}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch content");
    }

    const contentData = await response.json();

    const meta = {
      title: contentData.translations[locale]?.title || "",
      description: contentData.translations[locale]?.description || "",
      image: contentData.translations[locale]?.image || "",
      url: `${protocol}://${host}/tools/tagGenerator`,
    };

    return {
      props: {
        meta,
        ...(await serverSideTranslations(locale, [
          "common",
          "tagextractor",
          "navbar",
          "titlegenerator",
          "trending",
          "videoDataViewer",
          "banner",
          "logo",
          "search",
          "embed",
          "hashtag",
          "calculator",
          "thumbnail",
          "tdextractor",
          "channelId",
          "monetization",
          "keyword",
          "footer",
          "pricing",
        ])),
      },
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      props: {
        meta: {},
        ...(await serverSideTranslations(locale, [
          "common",
          "tagextractor",
          "navbar",
          "titlegenerator",
          "trending",
          "videoDataViewer",
          "banner",
          "logo",
          "search",
          "embed",
          "hashtag",
          "calculator",
          "thumbnail",
          "tdextractor",
          "channelId",
          "monetization",
          "keyword",
          "footer",
          "pricing",
        ])),
      },
    };
  }
}
