import { appGetLayout } from "components/AppRoute";
import StrongVerificationInstructionsPage from "features/auth/verification/StrongVerificationPage";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [AUTH, GLOBAL],
      nextI18nextConfig,
    )),
  },
});

export default function StrongVerificationPage() {
  return <StrongVerificationInstructionsPage />;
}

StrongVerificationPage.getLayout = appGetLayout();
