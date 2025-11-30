import Document, { Head, Html, Main, NextScript } from "next/document";

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang={this.props.locale ?? "en"}>
        <Head>
          <link rel="preconnect" href="https://cdn.couchers.org" />
          <meta name="theme-color" content="#00a398" />
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
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
