import { appGetLayout } from "components/AppRoute";
import Settings from "features/auth/Settings";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", ["global", "auth"])),
  },
});

export default function AccountSettingsPage() {
  return <Settings />;
}

AccountSettingsPage.getLayout = appGetLayout();
