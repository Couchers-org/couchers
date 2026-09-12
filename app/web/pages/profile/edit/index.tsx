import { appGetLayout } from "components/AppRoute";
import EditProfilePageComponent from "features/profile/edit/EditProfilePage";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { DEFAULT_LOCALE } from "i18n/locales";
import { GLOBAL, NOTIFICATIONS, PROFILE } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? DEFAULT_LOCALE, [GLOBAL, NOTIFICATIONS, PROFILE])),
  },
});

export default function EditProfilePage() {
  return <EditProfilePageComponent tab="about" />;
}

EditProfilePage.getLayout = appGetLayout({ noFooter: true });
