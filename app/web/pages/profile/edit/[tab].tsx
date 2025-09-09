import { GetStaticPaths, GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";

import { appGetLayout } from "@/components/AppRoute";
import NotFoundPage from "@/features/NotFoundPage";
import EditProfilePageComponent from "@/features/profile/edit/EditProfilePage";
import { GLOBAL, NOTIFICATIONS, PROFILE } from "@/i18n/namespaces";
import nextI18nextConfig from "@/next-i18next.config";
import { EDIT_USER_TABS } from "@/routes";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [GLOBAL, NOTIFICATIONS, PROFILE],
      nextI18nextConfig,
    )),
  },
});

const EditProfilePage = () => {
  const router = useRouter();

  const tab = router.query.tab;
  const parsedTab = EDIT_USER_TABS.find((valid) => tab === valid);
  if (!parsedTab) return <NotFoundPage />;

  return <EditProfilePageComponent tab={parsedTab} />;
};

EditProfilePage.getLayout = appGetLayout({ noFooter: true });

export default EditProfilePage;
