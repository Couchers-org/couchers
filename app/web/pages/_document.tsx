// import Document, { DocumentProps, Head, Html, Main, NextScript } from "next/document";
import { DocumentProps, Head, Html, Main, NextScript } from "next/document";

import { theme } from "@/theme";

const Document = (props: DocumentProps) => {
  return (
    <Html lang={props.locale ?? "en"}>
      <Head>
        <link rel="preconnect" href={Config.cdnBaseUrl} />
        <meta name="theme-color" content={theme.palette.primary.main} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo512.png" />
        <link
          rel="stylesheet"
          href={`${Config.cdnBaseUrl}/fonts/ubuntu/ubuntu.css`}
        />
        <link
          rel="stylesheet"
          href={`${Config.cdnBaseUrl}/fonts/wordmark/wordmark.css`}
        />
        {Config.recaptchaSiteKey && (
          <script
            async
            src={`https://www.google.com/recaptcha/enterprise.js?render=${Config.recaptchaSiteKey}`}
          ></script>
        )}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
};

export default Document;
