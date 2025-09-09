import { GetStaticPaths, GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";

import { appGetLayout } from "@/components/AppRoute";
import NotFoundPage from "@/features/NotFoundPage";
import GroupPageComponent from "@/features/communities/GroupPage";
import { COMMUNITIES, GLOBAL, NOTIFICATIONS } from "@/i18n/namespaces";
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
      [COMMUNITIES, GLOBAL, NOTIFICATIONS],
      nextI18nextConfig,
    )),
  },
});

const GroupPage = () => {
  const router = useRouter();

  if (!Config.isCommunitiesPart2Enabled) return <NotFoundPage />;

  const parsedId = Number.parseInt(stringOrFirstString(router.query.id) ?? "");
  if (isNaN(parsedId)) return <NotFoundPage />;
  const slug = stringOrFirstString(router.query.slug);

  return <GroupPageComponent groupId={parsedId} groupSlug={slug} />;
};

GroupPage.getLayout = appGetLayout();

export default GroupPage;
