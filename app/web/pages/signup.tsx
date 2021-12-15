import { appGetLayout } from "components/AppRoute";
import Signup from "features/auth/signup/Signup";

export default function SignupPage() {
  return <Signup />;
}

SignupPage.getLayout = appGetLayout({
  isPrivate: false,
  noFooter: true,
  variant: "full-screen",
});
