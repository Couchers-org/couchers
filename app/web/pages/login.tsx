import { appGetLayout } from "@/components/AppRoute";
import Login from "@/features/auth/login/Login";
import { AUTH, GLOBAL, LANDING } from "@/i18n/namespaces";
import { translationStaticProps } from "@/i18n/server-side-translations";

export const getStaticProps = translationStaticProps([GLOBAL, AUTH, LANDING]);

const LoginPage = () => {
  return <Login />;
};

LoginPage.getLayout = appGetLayout({
  isPrivate: false,
  noFooter: true,
  variant: "full-screen",
});

export default LoginPage;
