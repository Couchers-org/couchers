import { appGetLayout } from "components/AppRoute";
import GroupPageComponent from "features/communities/GroupPage";
import NotFoundPage from "features/NotFoundPage";
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
      ["global", "communities"],
      nextI18nextConfig
    )),
  },
});

export default function GroupPage() {
  const router = useRouter();

  if (!process.env.NEXT_PUBLIC_IS_COMMUNITIES_PART2_ENABLED)
    return <NotFoundPage />;

  const parsedId = Number.parseInt(stringOrFirstString(router.query.id) ?? "");
  if (isNaN(parsedId)) return <NotFoundPage />;
  const slug = stringOrFirstString(router.query.slug);

  return <GroupPageComponent groupId={parsedId} groupSlug={slug} />;
}

GroupPage.getLayout = appGetLayout();
