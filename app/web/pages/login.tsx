import { appGetLayout } from "components/AppRoute";
import Login from "features/auth/login/Login";
import { GetStaticProps } from "next";
import nextI18NextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      ["global", "auth"],
      nextI18NextConfig
    )),
  },
});

export default function LoginPage() {
  return <Login />;
}

LoginPage.getLayout = appGetLayout({
  isPrivate: false,
  noFooter: true,
  variant: "full-screen",
});
