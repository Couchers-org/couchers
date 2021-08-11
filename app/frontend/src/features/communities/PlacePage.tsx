import PagePage from "features/communities/PagePage";
import { PageType } from "proto/pages_pb";

export default function PlacePage() {
  return <PagePage pageType={PageType.PAGE_TYPE_PLACE} />;
}
