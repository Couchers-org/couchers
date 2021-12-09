import { appGetLayout } from "components/AppRoute";
import Login from "features/auth/login/Login";

export default function LoginPage() {
  return <Login />;
}

LoginPage.getLayout = appGetLayout({
  isPrivate: false,
  noFooter: true,
  variant: "full-screen",
});
