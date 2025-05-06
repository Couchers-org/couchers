import { appGetLayout } from "components/AppRoute";
import Logout from "features/auth/Logout";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [AUTH, GLOBAL],
      nextI18nextConfig,
    )),
  },
});
export default function LogoutPage() {
  return <Logout />;
}

LogoutPage.getLayout = appGetLayout({ isPrivate: false });
