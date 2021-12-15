import { appGetLayout } from "components/AppRoute";
import NotFoundPage from "features/NotFoundPage";
import { ProfilePage as ProfilePageComponent } from "features/profile";
import { useRouter } from "next/router";
import { userTabs } from "routes";

export default function ProfilePage() {
  const router = useRouter();

  const tab = router.query.tab;
  const parsedTab = userTabs.find((valid) => tab === valid);
  if (!parsedTab) return <NotFoundPage />;

  return <ProfilePageComponent tab={parsedTab} />;
}

ProfilePage.getLayout = appGetLayout();
