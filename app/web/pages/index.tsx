import { sessionCookieName } from "appConstants";
import { GetServerSideProps } from "next";
import { dashboardRoute, landingRoute } from "routes";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const route = context.req.cookies[sessionCookieName] ? dashboardRoute : landingRoute;
  const queryIndex = context.resolvedUrl.indexOf("?");
  return {
    redirect: {
      destination: queryIndex === -1 ? route : route + context.resolvedUrl.slice(queryIndex),
      permanent: true,
    },
  };
};

export default function HomePage() {
  return undefined;
}
