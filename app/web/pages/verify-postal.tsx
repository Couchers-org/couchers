import { appGetLayout } from "components/AppRoute";
import CompletePostalVerification from "features/auth/postalVerification/CompletePostalVerification";
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

export default function VerifyPostalPage() {
  return <CompletePostalVerification />;
}

VerifyPostalPage.getLayout = appGetLayout();
