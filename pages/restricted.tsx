import { appGetLayout } from "components/AppRoute";
import Jail from "features/auth/jail/Jail";

export default function RestrictedPage() {
  return <Jail />;
}

RestrictedPage.getLayout = appGetLayout();
