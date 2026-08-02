import { appGetLayout } from "components/AppRoute";
import CompleteStrongVerification from "features/auth/verification/CompleteStrongVerification";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { AUTH, GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? "en", [AUTH, GLOBAL, NOTIFICATIONS])),
  },
});

export default function CompletePasswordResetPage() {
  return <CompleteStrongVerification />;
}

CompletePasswordResetPage.getLayout = appGetLayout();
