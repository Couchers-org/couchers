import { appGetLayout } from "components/AppRoute";
import EditDiscussionPageComponent from "features/communities/discussions/EditDiscussionPage";
import NotFoundPage from "features/NotFoundPage";
import { COMMUNITIES, GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
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
    ...(await serverSideTranslations(locale ?? "en", [COMMUNITIES, GLOBAL, NOTIFICATIONS], nextI18nextConfig)),
  },
});

export default function EditDiscussionPage() {
  const router = useRouter();

  const parsedId = Number.parseInt(stringOrFirstString(router.query.id) ?? "");
  if (isNaN(parsedId)) return <NotFoundPage />;

  return <EditDiscussionPageComponent discussionId={parsedId} />;
}

EditDiscussionPage.getLayout = appGetLayout();
