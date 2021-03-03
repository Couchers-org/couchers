import { Page, PageType } from "pb/pages_pb";
import { guideRoute, placeRoute } from "routes";

export const pageURL = (page: Page.AsObject) => {
  return `${page.type === PageType.PAGE_TYPE_GUIDE ? guideRoute : placeRoute}/${
    page.pageId
  }/${page.slug}`;
};
