import { appGetLayout } from "components/AppRoute";
import { CompleteResetPassword } from "features/auth/password";
import { AUTH, GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [GLOBAL, AUTH, NOTIFICATIONS],
      nextI18nextConfig,
    )),
  },
});

export default function CompletePasswordResetPage() {
  return <CompleteResetPassword />;
}

CompletePasswordResetPage.getLayout = appGetLayout({
  isPrivate: false,
  variant: "full-screen",
});
