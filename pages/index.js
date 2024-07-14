import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import { useTranslation } from "react-i18next";
import TagGenerator from "./tools/tagGenerator";
import styles from "../styles/Home.module.css";

export default function Home({ meta }) {
  return (
    <div className={styles.container}>
   
      <main className={styles.main}>
        <TagGenerator meta={meta} />
      </main>
    </div>
  );
}

export async function getStaticProps({ locale }) {
  const host = process.env.HOST || "localhost:3000"; // or set your host
  const protocol = process.env.PROTOCOL || "http";
  const apiUrl = `${protocol}://${host}/api/content?category=tagGenerator&language=${locale}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch content");
    }

    const contentData = await response.json();

    const meta = {
      title: contentData[0]?.title || "",
      description: contentData[0]?.description || "",
      image: contentData[0]?.image || "",
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
