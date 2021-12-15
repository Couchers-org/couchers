import { appGetLayout } from "components/AppRoute";
import { ProfilePage as ProfilePageComponent } from "features/profile";

export default function ProfilePage() {
  return <ProfilePageComponent tab="about" />;
}

ProfilePage.getLayout = appGetLayout();
