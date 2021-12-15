import { appGetLayout } from "components/AppRoute";
import CommunityPageComponent from "features/communities/CommunityPage";
import NotFoundPage from "features/NotFoundPage";
import { useRouter } from "next/router";
import { communityTabs } from "routes";
import stringOrFirstString from "utils/stringOrFirstString";

export default function CommunityPage() {
  const router = useRouter();

  const parsedId = Number.parseInt(stringOrFirstString(router.query.id) ?? "");
  if (isNaN(parsedId)) return <NotFoundPage />;
  //first element of params is the tab
  const tab = stringOrFirstString(router.query.params);
  const parsedTab = tab ? communityTabs.find((valid) => tab === valid) : null;
  //null = not found, undefined = blank
  if (!parsedTab && parsedTab !== undefined) return <NotFoundPage />;
  const edit = router.query.params?.[1] === "edit";

  return (
    <CommunityPageComponent
      communityId={parsedId}
      tab={parsedTab}
      edit={edit}
    />
  );
}

CommunityPage.getLayout = appGetLayout();
