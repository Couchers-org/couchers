import { appGetLayout } from "components/AppRoute";
import Logout from "features/auth/Logout";

export default function LogoutPage() {
  return <Logout />;
}

LogoutPage.getLayout = appGetLayout();
