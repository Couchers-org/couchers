import { appGetLayout } from "components/AppRoute";
import { ResetPassword } from "features/auth/password";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      ["global", "auth"],
      nextI18nextConfig
    )),
  },
});
export default function PasswordResetPage() {
  return <ResetPassword />;
}

PasswordResetPage.getLayout = appGetLayout({
  isPrivate: false,
  variant: "full-screen",
});
