import { GetStaticPaths, GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";

import { appGetLayout } from "@/components/AppRoute";
import NotFoundPage from "@/features/NotFoundPage";
import CommunityPageComponent from "@/features/communities/CommunityPage";
import { COMMUNITIES, GLOBAL, NOTIFICATIONS } from "@/i18n/namespaces";
import nextI18nextConfig from "@/next-i18next.config";
import { COMMUNITY_TABS } from "@/routes";
import stringOrFirstString from "@/utils/stringOrFirstString";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [GLOBAL, COMMUNITIES, NOTIFICATIONS],
      nextI18nextConfig,
    )),
  },
});

const CommunityPage = () => {
  const router = useRouter();

  const parsedId = Number.parseInt(stringOrFirstString(router.query.id) ?? "");
  if (isNaN(parsedId)) return <NotFoundPage />;
  // first element of params is the tab
  const tab = stringOrFirstString(router.query.params);
  let parsedTab = undefined;
  if (tab) {
    // if the tab isn't blank and isn't valid, 404
    parsedTab = COMMUNITY_TABS.find((valid) => tab === valid);
    if (!parsedTab) return <NotFoundPage />;
  }
  const isEdit = router.query.params?.[1] === "edit";

  return (
    <CommunityPageComponent
      communityId={parsedId}
      tab={parsedTab}
      isEdit={isEdit}
    />
  );
};

CommunityPage.getLayout = appGetLayout();

export default CommunityPage;
