import { appGetLayout } from "components/AppRoute";
import Login from "features/auth/login/Login";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { translationStaticProps } from "i18n/server-side-translations";

export const getStaticProps = translationStaticProps([GLOBAL, AUTH]);

export default function LoginPage() {
  return <Login />;
}

LoginPage.getLayout = appGetLayout({
  isPrivate: false,
  noFooter: true,
  variant: "full-screen",
});
