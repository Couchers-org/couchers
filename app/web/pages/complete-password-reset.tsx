import { appGetLayout } from "components/AppRoute";
import { CompleteResetPassword } from "features/auth/password";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { AUTH, GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? "en", [GLOBAL, AUTH, NOTIFICATIONS])),
  },
});

export default function CompletePasswordResetPage() {
  return <CompleteResetPassword />;
}

CompletePasswordResetPage.getLayout = appGetLayout({
  isPrivate: false,
});
