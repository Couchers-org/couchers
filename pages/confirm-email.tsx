import { appGetLayout } from "components/AppRoute";
import ConfirmChangeEmail from "features/auth/email/ConfirmChangeEmail";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", ["global", "auth"])),
  },
});

export default function ConfirmEmailPage() {
  return <ConfirmChangeEmail />;
}

ConfirmEmailPage.getLayout = appGetLayout({ isPrivate: false });
