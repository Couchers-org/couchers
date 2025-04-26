import { appGetLayout } from "components/AppRoute";
import CompleteStrongVerification from "features/auth/verification/CompleteStrongVerification";
import { AUTH, GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [AUTH, GLOBAL, NOTIFICATIONS],
      nextI18nextConfig,
    )),
  },
});

export default function CompletePasswordResetPage() {
  return <CompleteStrongVerification />;
}

CompletePasswordResetPage.getLayout = appGetLayout();
