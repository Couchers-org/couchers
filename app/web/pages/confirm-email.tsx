import { appGetLayout } from "components/AppRoute";
import ConfirmChangeEmail from "features/auth/email/ConfirmChangeEmail";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { AUTH, GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? "en", [AUTH, GLOBAL, NOTIFICATIONS])),
  },
});

export default function ConfirmEmailPage() {
  return <ConfirmChangeEmail />;
}

ConfirmEmailPage.getLayout = appGetLayout({ isPrivate: false });
