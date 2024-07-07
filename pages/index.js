import Head from 'next/head';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import { useTranslation } from 'react-i18next';
import TagGenerator from './tools/TagGenerator';
import styles from '../styles/Home.module.css';

export default function Home() {
  const { t } = useTranslation('tagGenerator');

  return (
    <div className={styles.container}>
      <Head>
        <title>{t('title')}</title>
        <meta name="description" content={t('description')} />
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
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
