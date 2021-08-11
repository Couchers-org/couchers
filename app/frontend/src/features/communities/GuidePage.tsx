import PagePage from "features/communities/PagePage";
import { PageType } from "proto/pages_pb";

export default function GuidePage() {
  return <PagePage pageType={PageType.PAGE_TYPE_GUIDE} />;
}
