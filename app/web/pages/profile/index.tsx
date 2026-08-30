import { appGetLayout } from "components/AppRoute";
import { ProfilePage as ProfilePageComponent } from "features/profile";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { DEFAULT_LOCALE } from "i18n/locales";
import { CONNECTIONS, GLOBAL, NOTIFICATIONS, PROFILE } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? DEFAULT_LOCALE, [CONNECTIONS, GLOBAL, NOTIFICATIONS, PROFILE])),
  },
});

export default function ProfilePage() {
  return <ProfilePageComponent />;
}

ProfilePage.getLayout = appGetLayout();
