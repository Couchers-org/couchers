import { appGetLayout } from "components/AppRoute";
import { CompleteResetPassword } from "features/auth/password";

export default function CompletePasswordResetPage() {
  return <CompleteResetPassword />;
}

CompletePasswordResetPage.getLayout = appGetLayout({
  isPrivate: false,
  variant: "full-screen",
});
