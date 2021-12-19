import { appGetLayout } from "components/AppRoute";
import { ProfilePage as ProfilePageComponent } from "features/profile";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", ["global", "profile"])),
  },
});

export default function ProfilePage() {
  return <ProfilePageComponent tab="about" />;
}

ProfilePage.getLayout = appGetLayout();
