import { appGetLayout } from "components/AppRoute";
import PagePageComponent from "features/communities/PagePage";
import NotFoundPage from "features/NotFoundPage";
import { useRouter } from "next/router";
import { PageType } from "proto/pages_pb";
import stringOrFirstString from "utils/stringOrFirstString";

export default function PagePage() {
  const router = useRouter();

  const parsedId = Number.parseInt(stringOrFirstString(router.query.id) ?? "");
  if (isNaN(parsedId)) return <NotFoundPage />;
  const slug = stringOrFirstString(router.query.slug);

  return (
    <PagePageComponent
      pageType={PageType.PAGE_TYPE_GUIDE}
      pageId={parsedId}
      pageSlug={slug}
    />
  );
}

PagePage.getLayout = appGetLayout();
