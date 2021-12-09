import { appGetLayout } from "components/AppRoute";
import { ResetPassword } from "features/auth/password";

export default function PasswordResetPage() {
  return <ResetPassword />;
}

PasswordResetPage.getLayout = appGetLayout({
  isPrivate: false,
  variant: "full-screen",
});
