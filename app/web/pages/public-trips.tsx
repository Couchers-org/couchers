import { useFeatureValue } from "@growthbook/growthbook-react";
import { appGetLayout } from "components/AppRoute";
import MyPublicTripsPage from "features/publicTrips/MyPublicTripsPage";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { DEFAULT_LOCALE } from "i18n/locales";
import { COMMUNITIES, GLOBAL, NOTIFICATIONS, PUBLIC_TRIPS } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const isPublicTripsEnabled = process.env.NODE_ENV !== "production";

  if (!isPublicTripsEnabled) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      ...(await appServerSideTranslations(locale ?? DEFAULT_LOCALE, [
        GLOBAL,
        COMMUNITIES,
        NOTIFICATIONS,
        PUBLIC_TRIPS,
      ])),
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
