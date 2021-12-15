import { appGetLayout } from "components/AppRoute";
import GroupPageComponent from "features/communities/GroupPage";
import NotFoundPage from "features/NotFoundPage";
import { useRouter } from "next/router";
import stringOrFirstString from "utils/stringOrFirstString";

export default function GroupPage() {
  const router = useRouter();

  const parsedId = Number.parseInt(stringOrFirstString(router.query.id) ?? "");
  if (isNaN(parsedId)) return <NotFoundPage />;
  const slug = stringOrFirstString(router.query.slug);

  return <GroupPageComponent groupId={parsedId} groupSlug={slug} />;
}

GroupPage.getLayout = appGetLayout();
