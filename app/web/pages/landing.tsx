import { appGetLayout } from "components/AppRoute";
import LandingPage from "features/landing/LandingPage";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import {
  AUTH,
  DASHBOARD,
  GLOBAL,
  LANDING,
  NOTIFICATIONS,
} from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? "en", [
      AUTH,
      DASHBOARD,
      GLOBAL,
      LANDING,
      NOTIFICATIONS,
    ])),
  },
});

export default function HomePage() {
  return <LandingPage />;
}

HomePage.getLayout = appGetLayout({
  isPrivate: false,
  variant: "full-screen",
  bottomMargin: "80px",
});
