import { appGetLayout } from "components/AppRoute";
import NotFoundPage from "features/NotFoundPage";
import { ProfilePage as ProfilePageComponent } from "features/profile";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { DEFAULT_LOCALE } from "i18n/locales";
import { GLOBAL, NOTIFICATIONS, PROFILE } from "i18n/namespaces";
import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import { userTabs } from "routes";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? DEFAULT_LOCALE, [GLOBAL, PROFILE, NOTIFICATIONS])),
  },
});

export default function ProfilePage() {
  const router = useRouter();

  const tab = router.query.tab;
  const parsedTab = userTabs.find((valid) => tab === valid);
  if (!parsedTab) return <NotFoundPage />;

  return <ProfilePageComponent tab={parsedTab} />;
}

ProfilePage.getLayout = appGetLayout();
