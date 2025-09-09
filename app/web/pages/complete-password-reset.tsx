import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import { appGetLayout } from "@/components/AppRoute";
import { CompleteResetPassword } from "@/features/auth/password";
import { AUTH, GLOBAL, NOTIFICATIONS } from "@/i18n/namespaces";
import nextI18nextConfig from "@/next-i18next.config";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [GLOBAL, AUTH, NOTIFICATIONS],
      nextI18nextConfig,
    )),
  },
});

const CompletePasswordResetPage = () => {
  return <CompleteResetPassword />;
};

CompletePasswordResetPage.getLayout = appGetLayout({
  isPrivate: false,
  variant: "full-screen",
});

export default CompletePasswordResetPage;
