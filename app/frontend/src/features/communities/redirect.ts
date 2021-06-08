import { Page, PageType } from "proto/pages_pb";
import { routeToGuide, routeToPlace } from "routes";

export const pageURL = (page: Page.AsObject) =>
  page.type === PageType.PAGE_TYPE_GUIDE
    ? routeToGuide(page.pageId, page.slug)
    : routeToPlace(page.pageId, page.slug);
