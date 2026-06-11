import { appGetLayout } from "components/AppRoute";
import StrongVerificationInstructionsPage from "features/auth/verification/StrongVerificationPage";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? "en", [AUTH, GLOBAL])),
  },
});

export default function StrongVerificationPage() {
  return <StrongVerificationInstructionsPage />;
}

StrongVerificationPage.getLayout = appGetLayout();
