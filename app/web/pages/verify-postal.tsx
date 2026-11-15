import { appGetLayout } from "components/AppRoute";
import VerifyPostalPage from "features/auth/verification/VerifyPostalPage";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { DEFAULT_LOCALE } from "i18n/locales";
import { AUTH } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? DEFAULT_LOCALE, [AUTH])),
  },
});

export default function VerifyPostal() {
  return <VerifyPostalPage />;
}

VerifyPostal.getLayout = appGetLayout();
