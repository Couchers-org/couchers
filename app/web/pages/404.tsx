import { appGetLayout } from "components/AppRoute";
import NotFoundPage from "features/NotFoundPage";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      ["global"],
      nextI18nextConfig
    )),
  },
});

export default function Custom404() {
  return <NotFoundPage />;
}

Custom404.getLayout = appGetLayout({ isPrivate: false });
