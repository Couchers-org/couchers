import { appGetLayout } from "components/AppRoute";
import MyPublicTripsPage from "features/publicTrips/MyPublicTripsPage";
import {
  COMMUNITIES,
  GLOBAL,
  NOTIFICATIONS,
  PUBLIC_TRIPS,
} from "i18n/namespaces";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const isPublicTripsEnabled = process.env.NEXT_PUBLIC_COUCHERS_ENV !== "prod";

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  if (!isPublicTripsEnabled) {
    return { notFound: true };
  }
  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "en",
        [GLOBAL, COMMUNITIES, NOTIFICATIONS, PUBLIC_TRIPS],
        nextI18nextConfig,
      )),
    },
  };
};

export default function MyPublicTrips() {
  return <MyPublicTripsPage />;
}

MyPublicTrips.getLayout = appGetLayout({ isPrivate: true });
