import { GetStaticPaths, GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";

import { appGetLayout } from "@/components/AppRoute";
import NotFoundPage from "@/features/NotFoundPage";
import { ProfilePage as ProfilePageComponent } from "@/features/profile";
import { GLOBAL, NOTIFICATIONS, PROFILE } from "@/i18n/namespaces";
import nextI18nextConfig from "@/next-i18next.config";
import { USER_TABS } from "@/routes";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [GLOBAL, PROFILE, NOTIFICATIONS],
      nextI18nextConfig,
    )),
  },
});

const ProfilePage = () => {
  const router = useRouter();

  const tab = router.query.tab;
  const parsedTab = USER_TABS.find((valid) => tab === valid);
  if (!parsedTab) return <NotFoundPage />;

  return <ProfilePageComponent tab={parsedTab} />;
};

ProfilePage.getLayout = appGetLayout();

export default ProfilePage;
