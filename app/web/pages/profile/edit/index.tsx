import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import { appGetLayout } from "@/components/AppRoute";
import EditProfilePageComponent from "@/features/profile/edit/EditProfilePage";
import { GLOBAL, NOTIFICATIONS, PROFILE } from "@/i18n/namespaces";
import nextI18nextConfig from "@/next-i18next.config";

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

EditProfilePage.getLayout = appGetLayout({ noFooter: true });
