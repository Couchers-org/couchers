import { appGetLayout } from "components/AppRoute";
import SearchPageComponent from "features/search/SearchPage";
import { MapSearchProvider } from "features/search/state/mapSearchContext";
import { Coordinates } from "features/search/utils/constants";
import { GLOBAL, NOTIFICATIONS, PROFILE, SEARCH } from "i18n/namespaces";
import { translationStaticProps } from "i18n/server-side-translations";
import { GetStaticProps } from "next";
import { useRouter } from "next/router";

export const getStaticProps: GetStaticProps = translationStaticProps([
  GLOBAL,
  SEARCH,
  PROFILE,
  NOTIFICATIONS,
]);

export default function SearchPage() {
  const router = useRouter();

  const location = router.query.location as string;
  const bbox = router.query.bbox || undefined;

  return (
    <MapSearchProvider
      initialLocationName={location}
      initialBbox={bbox as Coordinates | undefined}
    >
      <SearchPageComponent />
    </MapSearchProvider>
  );
}

SearchPage.getLayout = appGetLayout({ noFooter: true, variant: "no-overflow" });
