import { appGetLayout } from "components/AppRoute";
import { DiscussionPage as DiscussionPageComponent } from "features/communities/discussions";
import NotFoundPage from "features/NotFoundPage";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { COMMUNITIES, GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
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
      COMMUNITIES,
      GLOBAL,
      NOTIFICATIONS,
    ])),
  },
});

export default function DiscussionPage() {
  const router = useRouter();

  const parsedId = Number.parseInt(stringOrFirstString(router.query.id) ?? "");
  if (isNaN(parsedId)) return <NotFoundPage />;

  return <DiscussionPageComponent discussionId={parsedId} />;
}

DiscussionPage.getLayout = appGetLayout();
