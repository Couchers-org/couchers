import { appGetLayout } from "components/AppRoute";
import { ResetPassword } from "features/auth/password";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? "en", ["global", "auth"])),
  },
});
export default function PasswordResetPage() {
  return <ResetPassword />;
}

PasswordResetPage.getLayout = appGetLayout({
  isPrivate: false,
  variant: "full-screen",
});
