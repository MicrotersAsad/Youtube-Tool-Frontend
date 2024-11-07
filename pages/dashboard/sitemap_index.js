import React from 'react';
import Layout from './layout';

const SitemapIndex = ({ baseUrl }) => {
    return (
        <Layout>
            <div style={styles.container}>
                <h1 style={styles.header}>Sitemap Overview</h1>
                <p style={styles.paragraph}>
                    Here is Our Sitemap: 
                    <a href={`${baseUrl}/sitemap.xml`} style={styles.link} target="_blank" rel="noopener noreferrer">
                        {baseUrl}/sitemap.xml
                    </a>
                </p>
            </div>
        </Layout>
    );
};

// Define styles as a JavaScript object
const styles = {
    container: {
        fontFamily: 'Arial, sans-serif',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        textAlign: 'center',
    },
    header: {
        color: '#333',
    },
    paragraph: {
        color: '#555',
        margin: '10px 0 20px',
    },
    link: {
        color: '#007BFF',
        textDecoration: 'none',
    },
};

// Use getServerSideProps to get the full base URL from the request headers
export async function getServerSideProps({ req }) {
    let protocol;
    let host = req.headers.host;

    // Check if running locally
    if (host.includes('localhost')) {
        protocol = 'http';
    } else {
        protocol = req.headers['x-forwarded-proto'] || (req.connection.encrypted ? 'https' : 'http');
    }

    const baseUrl = `${protocol}://${host}`;

    return {
        props: { baseUrl },
    };
}

export default SitemapIndex;
