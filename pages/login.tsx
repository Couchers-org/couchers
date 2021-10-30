import AppRoute from "components/AppRoute";
import Login from "features/auth/login/Login";
import { ReactNode } from "react";

export default function LoginPage() {
  return <Login />;
}

LoginPage.getLayout = function getLayout(page: ReactNode) {
  return (
    <AppRoute isPrivate={false} noFooter variant="full-screen">
      {page}
    </AppRoute>
  );
};
