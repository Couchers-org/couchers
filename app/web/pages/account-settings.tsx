import { appGetLayout } from "components/AppRoute";
import Settings from "features/auth/Settings";

export default function AccountSettingsPage() {
  return <Settings />;
}

AccountSettingsPage.getLayout = appGetLayout();
