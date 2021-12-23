import * as Sentry from "@sentry/nextjs";
import { NextPageContext } from "next";
import NextErrorComponent, { ErrorProps } from "next/error";

//see https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
const MyError = ({
  statusCode,
  hasGetInitialPropsRun,
  err,
}: ErrorProps &
  Pick<NextPageContext, "err"> & { hasGetInitialPropsRun: boolean }) => {
  if (!hasGetInitialPropsRun && err) {
    Sentry.captureException(err);
  }

  return <NextErrorComponent statusCode={statusCode} />;
};

MyError.getInitialProps = async (context: NextPageContext) => {
  Sentry.init({
    dsn: "https://5594adb1a53e41bfbb9f2cc5c91e2dbd@o782870.ingest.sentry.io/5887585",
    environment: process.env.NEXT_PUBLIC_COUCHERS_ENV,
    release: process.env.NEXT_PUBLIC_VERSION,
  });

  const errorInitialProps = {
    ...(await NextErrorComponent.getInitialProps(context)),
    hasGetInitialPropsRun: true,
  };

  // Running on the server, the response object (`res`) is available.
  //
  // Next.js will pass an err on the server if a page's data fetching methods
  // threw or returned a Promise that rejected
  //
  // Running on the client (browser), Next.js will provide an err if:
  //
  //  - a page's `getInitialProps` threw or returned a Promise that rejected
  //  - an exception was thrown somewhere in the React lifecycle (render,
  //    componentDidMount, etc) that was caught by Next.js's React Error
  //    Boundary. Read more about what types of exceptions are caught by Error
  //    Boundaries: https://reactjs.org/docs/error-boundaries.html

  if (context.err) {
    Sentry.captureException(context.err);
    await Sentry.flush(2000);
    return errorInitialProps;
  }

  // If this point is reached, getInitialProps was called without any
  // information about what the error might be. This is unexpected and may
  // indicate a bug introduced in Next.js, so record it in Sentry
  Sentry.captureException(
    new Error(
      `_error.js getInitialProps missing data at path: ${context.asPath}`
    )
  );
  await Sentry.flush(2000);

  return errorInitialProps;
};

export default MyError;
