import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import { appGetLayout } from "@/components/AppRoute";
import Settings from "@/features/auth/Settings";
import { AUTH, DONATIONS, GLOBAL, NOTIFICATIONS } from "@/i18n/namespaces";
import nextI18nextConfig from "@/next-i18next.config";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [AUTH, GLOBAL, NOTIFICATIONS, DONATIONS],
      nextI18nextConfig,
    )),
  },
});

const AccountSettingsPage = () => {
  return <Settings />;
};

AccountSettingsPage.getLayout = appGetLayout();

export default AccountSettingsPage;
