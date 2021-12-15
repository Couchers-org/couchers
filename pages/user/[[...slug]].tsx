import { appGetLayout } from "components/AppRoute";
import NotFoundPage from "features/NotFoundPage";
import UserPageComponent from "features/profile/view/UserPage";
import { useRouter } from "next/router";
import { userTabs } from "routes";
import stringOrFirstString from "utils/stringOrFirstString";

export default function CommunityPage() {
  const router = useRouter();

  const parsedId = Number.parseInt(stringOrFirstString(router.query.id) ?? "");
  if (isNaN(parsedId)) return <NotFoundPage />;
  //first element of params is the username
  const username = stringOrFirstString(router.query.params);
  if (!username) return <NotFoundPage />;
  const tab = router.query.params?.[1];
  const parsedTab = tab ? userTabs.find((valid) => tab === valid) : null;
  //null = not found, undefined = blank
  if (!parsedTab && parsedTab !== undefined) return <NotFoundPage />;

  return <UserPageComponent username={username} tab={parsedTab ?? "about"} />;
}

CommunityPage.getLayout = appGetLayout();
