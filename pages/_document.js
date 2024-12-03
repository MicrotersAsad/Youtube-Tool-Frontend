// pages/_document.js
import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
         
      
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" />
    
        

        </Head>
        <body>
          <Main />
          <NextScript />
          <script  src="https://unpkg.com/react@17.0.2/umd/react.production.min.js"></script>
          <script  src="https://unpkg.com/react-dom@17.0.2/umd/react-dom.production.min.js"></script>
          {/* <script  src="https://code.jquery.com/jquery-3.6.0.min.js"></script> */}
          <script src="https://code.jquery.com/jquery-1.12.4.min.js" integrity="sha256-ZosEbRLbNQzLpnKIkEdrPv7lOy9C27hHQ+Xp8a4MxAQ=" crossorigin="anonymous"></script>

         
          
      
         
        </body>
      </Html>
    );
  }
}

export default MyDocument;
