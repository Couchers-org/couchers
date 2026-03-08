import { appGetLayout } from "components/AppRoute";
import BadgesPageComponent from "features/badges/BadgesPage";
import { GLOBAL, NOTIFICATIONS, PROFILE } from "i18n/namespaces";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [PROFILE, GLOBAL, NOTIFICATIONS],
      nextI18nextConfig,
    )),
  },
});

export default function BadgesPage() {
  return <BadgesPageComponent />;
}

BadgesPage.getLayout = appGetLayout();
