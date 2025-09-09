import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import { appGetLayout } from "@/components/AppRoute";
import CompleteStrongVerification from "@/features/auth/verification/CompleteStrongVerification";
import { AUTH, GLOBAL, NOTIFICATIONS } from "@/i18n/namespaces";
import nextI18nextConfig from "@/next-i18next.config";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [AUTH, GLOBAL, NOTIFICATIONS],
      nextI18nextConfig,
    )),
  },
});

const CompletePasswordResetPage = () => {
  return <CompleteStrongVerification />;
};

CompletePasswordResetPage.getLayout = appGetLayout();

export default CompletePasswordResetPage;
