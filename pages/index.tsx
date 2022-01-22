import { appGetLayout } from "components/AppRoute";
import Index from "features/Index";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      ["global", "dashboard", "landing", "auth"],
      nextI18nextConfig
    )),
  },
});

export default function HomePage() {
  return <Index />;
}

HomePage.getLayout = appGetLayout({
  isPrivate: false,
  variant: "landing",
});
