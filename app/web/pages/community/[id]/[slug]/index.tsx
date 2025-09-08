import { GetStaticPaths, GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";

import { appGetLayout } from "@/components/AppRoute";
import NotFoundPage from "@/features/NotFoundPage";
import CommunityPageComponent from "@/features/communities/CommunityPage";
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
      [GLOBAL, COMMUNITIES, NOTIFICATIONS],
      nextI18nextConfig,
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
