import { appGetLayout } from "components/AppRoute";
import { DiscussionPage as DiscussionPageComponent } from "features/communities/discussions";
import NotFoundPage from "features/NotFoundPage";
import { useRouter } from "next/router";
import stringOrFirstString from "utils/stringOrFirstString";

export default function DiscussionPage() {
  const router = useRouter();

  const parsedId = Number.parseInt(stringOrFirstString(router.query.id) ?? "");
  if (isNaN(parsedId)) return <NotFoundPage />;

  return <DiscussionPageComponent discussionId={parsedId} />;
}

DiscussionPage.getLayout = appGetLayout();
