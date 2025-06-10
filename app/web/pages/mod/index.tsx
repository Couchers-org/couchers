import { appGetLayout } from "components/AppRoute";
import ModPageComponent from "features/mod/ModPage";
import { GLOBAL, MOD, PROFILE } from "i18n/namespaces";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [PROFILE, GLOBAL, MOD],
      nextI18nextConfig,
    )),
  },
});

export default function ModPage() {
  return <ModPageComponent />;
}

ModPage.getLayout = appGetLayout();
