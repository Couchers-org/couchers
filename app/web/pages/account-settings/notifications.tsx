import { appGetLayout } from "components/AppRoute";
import EditNotificationSettingsPageComponent from "features/notifications/EditNotificationSettingsPage";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { AUTH, GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? "en", [GLOBAL, AUTH, NOTIFICATIONS])),
  },
});

export default function EditNotificationSettingsPage() {
  return <EditNotificationSettingsPageComponent />;
}

EditNotificationSettingsPage.getLayout = appGetLayout();
