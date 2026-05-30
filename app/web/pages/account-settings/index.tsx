import { appGetLayout } from "components/AppRoute";
import Settings from "features/auth/Settings";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { AUTH, DONATIONS, GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? "en", [
      AUTH,
      GLOBAL,
      NOTIFICATIONS,
      DONATIONS,
    ])),
  },
});

export default function AccountSettingsPage() {
  return <Settings />;
}

AccountSettingsPage.getLayout = appGetLayout();
