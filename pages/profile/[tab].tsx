import { appGetLayout } from "components/AppRoute";
import NotFoundPage from "features/NotFoundPage";
import { ProfilePage as ProfilePageComponent } from "features/profile";
import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { userTabs } from "routes";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      ["global", "profile"],
      nextI18nextConfig
    )),
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
