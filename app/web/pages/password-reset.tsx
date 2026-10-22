import { appGetLayout } from "components/AppRoute";
import { ResetPassword } from "features/auth/password";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { DEFAULT_LOCALE } from "i18n/locales";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? DEFAULT_LOCALE, ["global", "auth"])),
  },
});
export default function PasswordResetPage() {
  return <ResetPassword />;
}

PasswordResetPage.getLayout = appGetLayout({
  isPrivate: false,
});
