import { GetStaticProps } from "next";
import { useRouter } from "next/router";

import { appGetLayout } from "@/components/AppRoute";
import SearchPageComponent from "@/features/search/SearchPage";
import { MapSearchProvider } from "@/features/search/state/mapSearchContext";
import { Coordinates } from "@/features/search/utils/constants";
import { GLOBAL, NOTIFICATIONS, PROFILE, SEARCH } from "@/i18n/namespaces";
import { translationStaticProps } from "@/i18n/server-side-translations";
import { HostingStatus } from "@/proto/api_pb";

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

  const hostingStatus = Array.isArray(router.query.hostingStatus)
    ? router.query.hostingStatus.map(
        (status) => Number(status) as HostingStatus,
      )
    : undefined;
  const showEmptyProfile =
    router.query.showEmptyProfile !== undefined
      ? router.query.showEmptyProfile === "false"
        ? false
        : true
      : undefined;

  return (
    <MapSearchProvider
      initialLocationName={location}
      initialBbox={bbox as Coordinates | undefined}
      initialFilters={{
        ...(hostingStatus && { hostingStatus }),
        ...(showEmptyProfile !== undefined && {
          showEmptyProfile: Boolean(showEmptyProfile),
        }),
      }}
    >
      <SearchPageComponent />
    </MapSearchProvider>
  );
}

SearchPage.getLayout = appGetLayout({ noFooter: true, variant: "no-overflow" });
