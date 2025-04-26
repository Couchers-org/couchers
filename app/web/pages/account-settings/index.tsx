import { appGetLayout } from "components/AppRoute";
import Settings from "features/auth/Settings";
import { AUTH, DONATIONS, GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [AUTH, GLOBAL, NOTIFICATIONS, DONATIONS],
      nextI18nextConfig,
    )),
  },
});

export default function AccountSettingsPage() {
  return <Settings />;
}

AccountSettingsPage.getLayout = appGetLayout();
