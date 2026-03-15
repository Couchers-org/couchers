import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import {
  documentGetInitialProps,
  DocumentHeadTags,
  DocumentHeadTagsProps,
} from "@mui/material-nextjs/v15-pagesRouter";
import {
  DocumentContext,
  DocumentProps,
  Head,
  Html,
  Main,
  NextScript,
} from "next/document";
import { theme } from "theme";

export default function MyDocument(
  props: DocumentProps & DocumentHeadTagsProps,
) {
  return (
    <Html lang={props.locale ?? "en"}>
      <Head>
        <DocumentHeadTags {...props} />

        <link rel="preconnect" href="https://cdn.couchers.org" />
        <meta name="theme-color" content={theme.palette.primary.main} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo512.png" />
        <link
          rel="stylesheet"
          href="https://cdn.couchers.org/fonts/ubuntu/ubuntu.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.couchers.org/fonts/wordmark/wordmark.css"
        />
        {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
          <script
            async
            src={`https://www.google.com/recaptcha/enterprise.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
          ></script>
        )}
        <script
          async
          src="https://twdl.couchers.org/script.js"
        ></script>
      </Head>
      <body>
        <InitColorSchemeScript
          defaultMode="system"
          attribute="data-mui-color-scheme"
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

MyDocument.getInitialProps = async (ctx: DocumentContext) => {
  const finalProps = await documentGetInitialProps(ctx);
  return finalProps;
};
