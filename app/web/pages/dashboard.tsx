import { appGetLayout } from "components/AppRoute";
import Dashboard from "features/dashboard/Dashboard";
import { AUTH, DASHBOARD, GLOBAL } from "i18n/namespaces";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [GLOBAL, DASHBOARD, AUTH],
      nextI18nextConfig
    )),
  },
});

//This page is (invisibly) rewritten to /landing if there is no couchers-sesh header
export default function HomePage() {
  return <Dashboard />;
}

HomePage.getLayout = appGetLayout({
  isPrivate: true,
});
