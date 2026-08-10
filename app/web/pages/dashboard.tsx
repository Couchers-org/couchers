import { appGetLayout } from "components/AppRoute";
import Dashboard from "features/dashboard/Dashboard";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { COMMUNITIES, DASHBOARD, GLOBAL, LANDING, NOTIFICATIONS, PROFILE } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? "en", [
      GLOBAL,
      DASHBOARD,
      LANDING,
      NOTIFICATIONS,
      PROFILE,
      COMMUNITIES,
    ])),
  },
});

//This page is (invisibly) rewritten to /landing if there is no couchers-sesh header
export default function HomePage() {
  return <Dashboard />;
}

HomePage.getLayout = appGetLayout({
  isPrivate: true,
  variant: "full-width",
});
