import { GetServerSideProps } from "next";

import { sessionCookieName } from "@/appConstants";
import { dashboardRoute, landingRoute } from "@/routes";

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    redirect: {
      destination: context.req.cookies[sessionCookieName]
        ? dashboardRoute
        : landingRoute,
      permanent: true,
    },
  };
};

export default function HomePage() {
  return undefined;
}
