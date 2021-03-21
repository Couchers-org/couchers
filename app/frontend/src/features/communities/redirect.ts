import { Page, PageType } from "pb/pages_pb";
import { routeToGuide, routeToPlace } from "routes";

export const pageURL = (page: Page.AsObject) => {
  if (page.type === PageType.PAGE_TYPE_GUIDE) {
    return routeToGuide(page.pageId, page.slug);
  } else {
    return routeToPlace(page.pageId, page.slug);
  }
};
