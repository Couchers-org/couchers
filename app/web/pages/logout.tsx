import { appGetLayout } from "components/AppRoute";
import Logout from "features/auth/Logout";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { DEFAULT_LOCALE } from "i18n/locales";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? DEFAULT_LOCALE, [AUTH, GLOBAL])),
  },
});
export default function LogoutPage() {
  return <Logout />;
}

LogoutPage.getLayout = appGetLayout({ isPrivate: false });
