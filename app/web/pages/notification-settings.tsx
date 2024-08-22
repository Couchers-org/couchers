import { appGetLayout } from "components/AppRoute";
import EditNotificationSettingsPageComponent from "features/profile/edit/notificationSettings/EditNotificationSettingsPage";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      ["global", "profile"],
      nextI18nextConfig
    )),
  },
});

export default function EditNotificationSettingsPage() {
  return <EditNotificationSettingsPageComponent />;
}

EditNotificationSettingsPage.getLayout = appGetLayout();
