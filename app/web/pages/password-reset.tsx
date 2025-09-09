import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import { appGetLayout } from "@/components/AppRoute";
import { ResetPassword } from "@/features/auth/password";
import nextI18nextConfig from "@/next-i18next.config";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      ["global", "auth"],
      nextI18nextConfig,
    )),
  },
});

const PasswordResetPage = () => {
  return <ResetPassword />;
};

PasswordResetPage.getLayout = appGetLayout({
  isPrivate: false,
  variant: "full-screen",
});

export default PasswordResetPage;
