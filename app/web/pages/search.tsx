import { translationStaticProps } from "i18n/server-side-translations";
import SearchPageComponent from "features/search/SearchPage";
import { GLOBAL, PROFILE, SEARCH } from "i18n/namespaces";
import { Coordinates } from "features/search/constants";
import { appGetLayout } from "components/AppRoute";
import { useRouter } from "next/router";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = translationStaticProps([
  GLOBAL,
  SEARCH,
  PROFILE,
]);

export default function SearchPage() {
  const router = useRouter();

  const location = router.query.location || "";
  const bbox = router.query.bbox || [0, 0, 0, 0];

  return (
    <SearchPageComponent
      locationName={location as string}
      bbox={bbox as Coordinates}
    />
  );
}

SearchPage.getLayout = appGetLayout({ noFooter: true });
