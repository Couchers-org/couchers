import { appGetLayout } from "components/AppRoute";
import ConfirmChangeEmail from "features/auth/email/ConfirmChangeEmail";
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

export default function ConfirmEmailPage() {
  return <ConfirmChangeEmail />;
}

ConfirmEmailPage.getLayout = appGetLayout({ isPrivate: false });
