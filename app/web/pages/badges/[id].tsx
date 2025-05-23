import { appGetLayout } from "components/AppRoute";
import BadgesPageComponent from "features/badges/BadgesPage";
import NotFoundPage from "features/NotFoundPage";
import { GLOBAL, NOTIFICATIONS, PROFILE } from "i18n/namespaces";
import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import stringOrFirstString from "utils/stringOrFirstString";

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

export default function BadgesPage() {
  const router = useRouter();
  const id = stringOrFirstString(router.query.id);
  return !id ? <NotFoundPage /> : <BadgesPageComponent badgeId={id} />;
}

BadgesPage.getLayout = appGetLayout();
