import { appGetLayout } from "components/AppRoute";
import Verification from "features/auth/verification/VerificationPage";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? "en", [AUTH, GLOBAL])),
  },
});

export default function VerificationPage() {
  return <Verification />;
}

VerificationPage.getLayout = appGetLayout();
