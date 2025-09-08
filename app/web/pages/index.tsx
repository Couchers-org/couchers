import { GetServerSideProps } from "next";

import { sessionCookieName } from "@/appConstants";
import { DASHBOARD_ROUTE, landingRoute } from "@/routes";

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    redirect: {
      destination: context.req.cookies[sessionCookieName]
        ? DASHBOARD_ROUTE
        : landingRoute,
      permanent: true,
    },
  };
};

export default function HomePage() {
  return undefined;
}
