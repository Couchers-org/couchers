import { appGetLayout } from "components/AppRoute";
import EditNotificationSettingsPageComponent from "features/auth/notifications/EditNotificationSettingsPage";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [GLOBAL, AUTH],
      nextI18nextConfig
    )),
  },
});

export default function EditNotificationSettingsPage() {
  return <EditNotificationSettingsPageComponent />;
}

EditNotificationSettingsPage.getLayout = appGetLayout();
