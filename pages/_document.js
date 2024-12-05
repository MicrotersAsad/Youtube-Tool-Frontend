import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Bootstrap CSS */}
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" />
        </Head>
        <body>
          <Main />
          <NextScript />

          
          {/* jQuery script with defer */}
          <script
            src="https://code.jquery.com/jquery-1.12.4.min.js"
            integrity="sha256-ZosEbRLbNQzLpnKIkEdrPv7lOy9C27hHQ+Xp8a4MxAQ="
            crossOrigin="anonymous"
            defer
          ></script>
        </body>
      </Html>
    );
  }
}

export default MyDocument;
