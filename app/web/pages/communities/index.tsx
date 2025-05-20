import { appGetLayout } from "components/AppRoute";
import CommunitiesPage from "features/communities/CommunitiesPage/CommunitiesPage";
import { COMMUNITIES, DASHBOARD, GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [GLOBAL, DASHBOARD, COMMUNITIES, NOTIFICATIONS],
      nextI18nextConfig,
    )),
  },
});

export default function CommunitiesRoute() {
  return <CommunitiesPage />;
}

CommunitiesRoute.getLayout = appGetLayout();
