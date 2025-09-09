import { GetServerSideProps } from "next";

import { sessionCookieName } from "@/appConstants";
import { DASHBOARD_ROUTE, LANDING_ROUTE } from "@/routes";

// eslint-disable-next-line @typescript-eslint/require-await
export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    redirect: {
      destination: context.req.cookies[sessionCookieName]
        ? DASHBOARD_ROUTE
        : LANDING_ROUTE,
      permanent: true,
    },
  };
};

const HomePage = () => undefined;

export default HomePage;
