import { appGetLayout } from "components/AppRoute";
import CommunityPageComponent from "features/communities/CommunityPage";
import NotFoundPage from "features/NotFoundPage";
import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { communityTabs } from "routes";
import stringOrFirstString from "utils/stringOrFirstString";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [""],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      ["global", "communities"],
      nextI18nextConfig
    )),
  },
});

export default function CommunityPage() {
  const router = useRouter();

  const parsedId = Number.parseInt(stringOrFirstString(router.query.id) ?? "");
  if (isNaN(parsedId)) return <NotFoundPage />;
  //first element of params is the tab
  const tab = stringOrFirstString(router.query.params);
  let parsedTab = undefined;
  if (tab) {
    //if the tab isn't blank and isn't valid, 404
    parsedTab = communityTabs.find((valid) => tab === valid);
    if (!parsedTab) return <NotFoundPage />;
  }
  const edit = router.query.params?.[1] === "edit";

  return (
    <CommunityPageComponent
      communityId={parsedId}
      tab={parsedTab}
      edit={edit}
    />
  );
}

CommunityPage.getLayout = appGetLayout();
