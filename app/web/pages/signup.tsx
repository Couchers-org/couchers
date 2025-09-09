import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import { appGetLayout } from "@/components/AppRoute";
import Signup from "@/features/auth/signup/Signup";
import { AUTH, GLOBAL, LANDING } from "@/i18n/namespaces";
import nextI18nextConfig from "@/next-i18next.config";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [AUTH, GLOBAL, LANDING],
      nextI18nextConfig,
    )),
  },
});

const SignupPage = () => {
  return <Signup />;
};

SignupPage.getLayout = appGetLayout({
  isPrivate: false,
  noFooter: true,
  variant: "full-screen",
});

export default SignupPage;
