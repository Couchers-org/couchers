import { appGetLayout } from "components/AppRoute";
import Logout from "features/auth/Logout";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? "en", [AUTH, GLOBAL])),
  },
});
export default function LogoutPage() {
  return <Logout />;
}

LogoutPage.getLayout = appGetLayout({ isPrivate: false });
