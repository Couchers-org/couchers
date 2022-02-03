import { appGetLayout } from "components/AppRoute";
import Logout from "features/auth/Logout";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      ["global", "auth"],
      nextI18nextConfig
    )),
  },
});
export default function LogoutPage() {
  return <Logout />;
}

LogoutPage.getLayout = appGetLayout({ isPrivate: false });
