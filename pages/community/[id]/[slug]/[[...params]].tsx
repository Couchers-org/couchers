import { appGetLayout } from "components/AppRoute";
import CommunityPageComponent from "features/communities/CommunityPage";
import NotFoundPage from "features/NotFoundPage";
import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { communityTabs } from "routes";
import stringOrFirstString from "utils/stringOrFirstString";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", [
      "global",
      "communities",
    ])),
  },
});

export default function CommunityPage() {
  const router = useRouter();

  const parsedId = Number.parseInt(stringOrFirstString(router.query.id) ?? "");
  if (isNaN(parsedId)) return <NotFoundPage />;
  //first element of params is the tab
  const tab = stringOrFirstString(router.query.params);
  const parsedTab = tab ? communityTabs.find((valid) => tab === valid) : null;
  //null = not found, undefined = blank
  if (!parsedTab && parsedTab !== undefined) return <NotFoundPage />;
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
