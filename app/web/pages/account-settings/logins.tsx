import { appGetLayout } from "components/AppRoute";
import LoginsPageComponent from "features/auth/logins/LoginsPage";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { DEFAULT_LOCALE } from "i18n/locales";
import { AUTH, GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? DEFAULT_LOCALE, [GLOBAL, AUTH, NOTIFICATIONS])),
  },
});

export default function LoginsPage() {
  return <LoginsPageComponent />;
}

LoginsPage.getLayout = appGetLayout();
