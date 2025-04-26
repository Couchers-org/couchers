import { appGetLayout } from "components/AppRoute";
import EditProfilePageComponent from "features/profile/edit/EditProfilePage";
import { GLOBAL, NOTIFICATIONS, PROFILE } from "i18n/namespaces";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [GLOBAL, NOTIFICATIONS, PROFILE],
      nextI18nextConfig,
    )),
  },
});

export default function EditProfilePage() {
  return <EditProfilePageComponent tab="about" />;
}

EditProfilePage.getLayout = appGetLayout();
