import { appGetLayout } from "components/AppRoute";
import Signup from "features/auth/signup/Signup";
import { AUTH, GLOBAL, LANDING, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import nextI18nextConfig from "../next-i18next.config";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [AUTH, GLOBAL, LANDING, NOTIFICATIONS],
      nextI18nextConfig,
    )),
  },
});

export default function InvitePage() {
  return <Signup />;
}

InvitePage.getLayout = appGetLayout({
  isPrivate: false,
  noFooter: true,
  variant: "full-screen",
});
