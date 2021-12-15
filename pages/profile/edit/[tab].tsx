import { appGetLayout } from "components/AppRoute";
import NotFoundPage from "features/NotFoundPage";
import EditProfilePageComponent from "features/profile/edit/EditProfilePage";
import { useRouter } from "next/router";
import { editUserTabs } from "routes";

export default function EditProfilePage() {
  const router = useRouter();

  const tab = router.query.tab;
  const parsedTab = editUserTabs.find((valid) => tab === valid);
  if (!parsedTab) return <NotFoundPage />;

  return <EditProfilePageComponent tab={parsedTab} />;
}

EditProfilePage.getLayout = appGetLayout();
