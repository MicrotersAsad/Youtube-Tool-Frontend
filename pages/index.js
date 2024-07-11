import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import { useTranslation } from "react-i18next";
import TagGenerator from "./tools/tagGenerator";
import styles from "../styles/Home.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Youtube Tools</title>
        <meta name="description" content="Youtube Tools" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <TagGenerator />
      </main>
    </div>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
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
        "pricing"
      ])),
    },
  };
}
