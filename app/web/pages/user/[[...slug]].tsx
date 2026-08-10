import { appGetLayout } from "components/AppRoute";
import NotFoundPage from "features/NotFoundPage";
import UserPageComponent from "features/profile/view/UserPage";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { CONNECTIONS, DASHBOARD, GLOBAL, NOTIFICATIONS, PROFILE } from "i18n/namespaces";
import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import { userTabs } from "routes";
import stringOrFirstString from "utils/stringOrFirstString";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? "en", [CONNECTIONS, DASHBOARD, GLOBAL, NOTIFICATIONS, PROFILE])),
  },
});

export default function UserPage() {
  const router = useRouter();

  //first element of slug is the username
  const username = stringOrFirstString(router.query.slug);
  if (!username) return <NotFoundPage />;
  const tab = router.query.slug?.[1];
  let parsedTab = undefined;
  if (tab) {
    parsedTab = userTabs.find((valid) => tab === valid);
    if (!parsedTab) return <NotFoundPage />;
  }

  return <UserPageComponent username={username} tab={parsedTab} />;
}

UserPage.getLayout = appGetLayout();
