import { PageType } from "@couchers/services/pages";
import { GetStaticPaths, GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";

import { appGetLayout } from "@/components/AppRoute";
import NotFoundPage from "@/features/NotFoundPage";
import PagePageComponent from "@/features/communities/PagePage";
import { GLOBAL, NOTIFICATIONS } from "@/i18n/namespaces";
import nextI18NextConfig from "@/next-i18next.config";
import stringOrFirstString from "@/utils/stringOrFirstString";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [GLOBAL, NOTIFICATIONS],
      nextI18NextConfig,
    )),
  },
});
const PagePage = () => {
  const router = useRouter();

  if (!Config.isCommunitiesPart2Enabled) return <NotFoundPage />;

  const parsedId = Number.parseInt(stringOrFirstString(router.query.id) ?? "");
  if (isNaN(parsedId)) return <NotFoundPage />;
  const slug = stringOrFirstString(router.query.slug);

  return (
    <PagePageComponent
      pageType={PageType.PAGE_TYPE_PLACE}
      pageId={parsedId}
      pageSlug={slug}
    />
  );
};

PagePage.getLayout = appGetLayout();

export default PagePage;
