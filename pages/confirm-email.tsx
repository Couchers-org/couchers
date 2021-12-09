import { appGetLayout } from "components/AppRoute";
import ConfirmChangeEmail from "features/auth/email/ConfirmChangeEmail";

export default function ConfirmEmailPage() {
  return <ConfirmChangeEmail />;
}

ConfirmEmailPage.getLayout = appGetLayout({ isPrivate: false });
