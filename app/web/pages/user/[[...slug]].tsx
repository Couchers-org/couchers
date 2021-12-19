import { appGetLayout } from "components/AppRoute";
import NotFoundPage from "features/NotFoundPage";
import UserPageComponent from "features/profile/view/UserPage";
import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { userTabs } from "routes";
import stringOrFirstString from "utils/stringOrFirstString";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", ["global", "profile"])),
  },
});

export default function UserPage() {
  const router = useRouter();

  const parsedId = Number.parseInt(stringOrFirstString(router.query.id) ?? "");
  if (isNaN(parsedId)) return <NotFoundPage />;
  //first element of params is the username
  const username = stringOrFirstString(router.query.params);
  if (!username) return <NotFoundPage />;
  const tab = router.query.params?.[1];
  const parsedTab = tab ? userTabs.find((valid) => tab === valid) : null;
  //null = not found, undefined = blank
  if (!parsedTab && parsedTab !== undefined) return <NotFoundPage />;

  return <UserPageComponent username={username} tab={parsedTab ?? "about"} />;
}

UserPage.getLayout = appGetLayout();
