import { appGetLayout } from "components/AppRoute";
import { Coordinates } from "features/search/utils/constants";
import SearchPageComponent from "features/search/SearchPage";
import { GLOBAL, PROFILE, SEARCH } from "i18n/namespaces";
import { translationStaticProps } from "i18n/server-side-translations";
import { GetStaticProps } from "next";
import { useRouter } from "next/router";

export const getStaticProps: GetStaticProps = translationStaticProps([
  GLOBAL,
  SEARCH,
  PROFILE,
]);

export default function SearchPage() {
  const router = useRouter();

  const location = router.query.location as string;
  const bbox = (router.query.bbox || [390, 82, -173, -66]) as Coordinates;

  // @TODO - Checking the open street map docs, it looks like the reason this type is being so tricky is because open street map returns
  // "boundingbox" as a string[] and not a number[] as we have it defined in our codebase in the Coordinates type.
  // See the docs here with the example response: https://wiki.openstreetmap.org/wiki/Bounding_box
  // We're calling the openstreet map api in the useGeocodeQuery hook on line 108

  return <SearchPageComponent locationName={location} bbox={bbox} />;
}

SearchPage.getLayout = appGetLayout({ noFooter: true });
