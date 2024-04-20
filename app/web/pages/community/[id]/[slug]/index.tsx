import { appGetLayout } from "components/AppRoute";
import CommunityPageComponent from "features/communities/CommunityPage";
import NotFoundPage from "features/NotFoundPage";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
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
      [GLOBAL, COMMUNITIES],
      nextI18nextConfig
    )),
  },
});

// Using optional catch all route [[...params]] doesn't work here when deployed only
// - maybe because of the other dynamic parts of the path...
export default function CommunityPage() {
  const router = useRouter();

  const parsedId = Number.parseInt(stringOrFirstString(router.query.id) ?? "");
  if (isNaN(parsedId)) return <NotFoundPage />;

  return (
    <CommunityPageComponent
      communityId={parsedId}
      tab={undefined}
      edit={undefined}
    />
  );
}

CommunityPage.getLayout = appGetLayout();
