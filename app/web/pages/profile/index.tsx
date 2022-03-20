import { appGetLayout } from "components/AppRoute";
import { ProfilePage as ProfilePageComponent } from "features/profile";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      ["global", "profile", "connections"],
      nextI18nextConfig
    )),
  },
});

export default function ProfilePage() {
  return <ProfilePageComponent />;
}

ProfilePage.getLayout = appGetLayout();
