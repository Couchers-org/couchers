import { GetStaticPaths, GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";

import { appGetLayout } from "@/components/AppRoute";
import NotFoundPage from "@/features/NotFoundPage";
import BadgesPageComponent from "@/features/badges/BadgesPage";
import { GLOBAL, NOTIFICATIONS, PROFILE } from "@/i18n/namespaces";
import nextI18nextConfig from "@/next-i18next.config";
import stringOrFirstString from "@/utils/stringOrFirstString";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [PROFILE, GLOBAL, NOTIFICATIONS],
      nextI18nextConfig,
    )),
  },
});

const BadgesPage = () => {
  const router = useRouter();
  const id = stringOrFirstString(router.query.id);
  return !id ? <NotFoundPage /> : <BadgesPageComponent badgeId={id} />;
};

BadgesPage.getLayout = appGetLayout();

export default BadgesPage;
