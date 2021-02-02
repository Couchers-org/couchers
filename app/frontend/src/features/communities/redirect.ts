import { guideRoute,placeRoute } from "../../AppRoutes"
import { Page, PageType } from "../../pb/pages_pb"

export const pageURL = (page: Page.AsObject) => {
  return `${page.type === PageType.PAGE_TYPE_GUIDE ? guideRoute : placeRoute}/${page.pageId}/${page.slug}`
}
