import { appGetLayout } from "components/AppRoute";
import { Coordinates } from "features/search/constants";
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

  const location = router.query.location || "";
  const bbox = router.query.bbox || [390, 82, -173, -66];

  return (
    <SearchPageComponent
      locationName={location as string}
      bbox={bbox as Coordinates}
    />
  );
}

SearchPage.getLayout = appGetLayout({ noFooter: true });
