import { appGetLayout } from "components/AppRoute";
import CommunityPageComponent from "features/communities/CommunityPage";
import NotFoundPage from "features/NotFoundPage";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import {
  COMMUNITIES,
  GLOBAL,
  MESSAGES,
  NOTIFICATIONS,
  PROFILE,
  PUBLIC_TRIPS,
} from "i18n/namespaces";
import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import stringOrFirstString from "utils/stringOrFirstString";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? "en", [
      GLOBAL,
      COMMUNITIES,
      NOTIFICATIONS,
      PROFILE,
      MESSAGES,
      PUBLIC_TRIPS,
    ])),
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
