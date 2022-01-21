import { appGetLayout } from "components/AppRoute";
import Dashboard from "features/dashboard/Dashboard";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      ["global", "dashboard"],
      nextI18nextConfig
    )),
  },
});

export default function HomePage() {
  return <Dashboard />;
}

HomePage.getLayout = appGetLayout();
