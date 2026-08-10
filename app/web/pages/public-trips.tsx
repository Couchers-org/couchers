import { useFeatureValue } from "@growthbook/growthbook-react";
import { appGetLayout } from "components/AppRoute";
import MyPublicTripsPage from "features/publicTrips/MyPublicTripsPage";
import { COMMUNITIES, GLOBAL, NOTIFICATIONS, PUBLIC_TRIPS } from "i18n/namespaces";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const isPublicTripsEnabled = process.env.NODE_ENV !== "production";

  if (!isPublicTripsEnabled) {
    return {
      notFound: true,
    };
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
  const isPublicTripsEnabled = useFeatureValue("public_trips_enabled", false);

  if (!isPublicTripsEnabled) {
    return null;
  }

  return <MyPublicTripsPage />;
}

MyPublicTrips.getLayout = appGetLayout({ isPrivate: true });
