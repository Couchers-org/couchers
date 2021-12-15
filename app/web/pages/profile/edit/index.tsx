import { appGetLayout } from "components/AppRoute";
import EditProfilePageComponent from "features/profile/edit/EditProfilePage";

export default function EditProfilePage() {
  return <EditProfilePageComponent tab="about" />;
}

EditProfilePage.getLayout = appGetLayout();
