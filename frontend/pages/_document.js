// frontend/pages/_document.js
import { Html, Head, Main, NextScript } from "next/document";
export default function Document() {
  return (
    <Html>
      <Head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        {/* Or: <link rel="shortcut icon" href="/favicon.png" /> */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

