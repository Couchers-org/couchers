import { appGetLayout } from "components/AppRoute";
import GroupPageComponent from "features/communities/GroupPage";
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
    ...(await appServerSideTranslations(locale ?? "en", [COMMUNITIES, GLOBAL, NOTIFICATIONS])),
  },
});

export default function GroupPage() {
  const router = useRouter();

  if (!process.env.NEXT_PUBLIC_IS_COMMUNITIES_PART2_ENABLED) return <NotFoundPage />;

  const parsedId = Number.parseInt(stringOrFirstString(router.query.id) ?? "");
  if (isNaN(parsedId)) return <NotFoundPage />;
  const slug = stringOrFirstString(router.query.slug);

  return <GroupPageComponent groupId={parsedId} groupSlug={slug} />;
}

GroupPage.getLayout = appGetLayout();
