import { appGetLayout } from "components/AppRoute";
import NotFoundPage from "features/NotFoundPage";
import { GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "en",
        [GLOBAL, NOTIFICATIONS],
        nextI18nextConfig,
      )),
    },
  };
};

export default function Custom404() {
  return <NotFoundPage />;
}

Custom404.getLayout = appGetLayout({
  isPrivate: false,
});
