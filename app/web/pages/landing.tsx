import { appGetLayout } from "components/AppRoute";
import LandingPage from "features/landing/LandingPage";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { DEFAULT_LOCALE } from "i18n/locales";
import { AUTH, DASHBOARD, GLOBAL, LANDING, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? DEFAULT_LOCALE, [AUTH, DASHBOARD, GLOBAL, LANDING, NOTIFICATIONS])),
  },
});

export default function HomePage() {
  return <LandingPage />;
}

HomePage.getLayout = appGetLayout({
  isPrivate: false,
  variant: "full-width",
  bottomMargin: "80px",
});
