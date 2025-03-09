import { styled, useMediaQuery } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import {
  HostingStatusOptions,
  MapSearchTypes,
  SleepingArrangementOptions,
} from "features/search/utils/constants";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { useMemo, useRef, useState } from "react";
import { MapProvider, MapRef } from "react-map-gl/maplibre";
import { theme } from "theme";
import { GeocodeResult } from "utils/hooks";

import DesktopMapView from "./DesktopMapView";
import FilterDialog from "./FilterDialog";
import { useUserSearch } from "./hooks/useUserSearch";
import MobileMapView from "./MobileMapView";
import { useMapSearchState } from "./state/mapSearchContext";

export type FilterOptions = {
  acceptsKids?: boolean;
  acceptsPets?: boolean;
  acceptsLastMinRequests?: boolean;
  ageMin?: number | undefined;
  ageMax?: number | undefined;
  completeProfile?: boolean;
  drinkingAllowed?: boolean;
  hasReferences?: boolean;
  hasStrongVerification?: boolean;
  hostingStatus?: HostingStatusOptions[];
  numGuests?: number;
  lastActive?: number;
  lng?: number;
  lat?: number;
  selectedUserId?: number;
  sleepingArrangement?: SleepingArrangementOptions[];
  smokingAllowed?: boolean;
};

export type SearchOptions = {
  bbox?: GeocodeResult["bbox"];
  query?: string;
  keyword?: string;
  location?: GeocodeResult;
};

const SearchPageContainer = styled("div")(({ theme }) => ({
  height: `calc(100vh - 10px - ${theme.shape.navPaddingXs})`,

  [theme.breakpoints.up("sm")]: {
    height: `calc(100vh - ${theme.shape.navPaddingSmUp})`,
  },

  overflow: "hidden",
  paddingLeft: `-${theme.spacing(2)}`,
  paddingRight: `-${theme.spacing(2)}`,
}));

/**
 * Search page, creates the state, obtains the users, renders all its sub-components
 */
export default function SearchPage() {
  const { t } = useTranslation([GLOBAL, SEARCH]);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const mapRef = useRef<MapRef | null>(null);

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchType, setSearchType] = useState<MapSearchTypes>("location");

  const mapSearchState = useMapSearchState();

  // useMemo to avoid unnecessary object reference changes - causing unnecessary rerenders
  const searchParams = useMemo(
    () => ({ ...mapSearchState.filters, ...mapSearchState.search }),
    [mapSearchState.filters, mapSearchState.search],
  );

  const {
    fetchNextPage,
    fetchPreviousPage,
    isLoading,
    hasNextPage,
    hasPreviousPage,
    setPageNumber,
    totalItems,
    users,
  } = useUserSearch(searchParams, mapSearchState);

  const handleSetSearchType = (type: MapSearchTypes) => {
    setSearchType(type);
  };

  const handleOpenFiltersDialog = () => {
    setIsFiltersOpen(true);
  };

  const handleCloseFiltersDialog = () => {
    setIsFiltersOpen(false);
  };

  const handleLoadPreviousPage = () => {
    fetchPreviousPage();
    setPageNumber((prev) => prev - 1);
  };

  const handleLoadNextPage = () => {
    fetchNextPage();
    setPageNumber((prev) => prev + 1);
  };

  return (
    <SearchPageContainer>
      <MapProvider>
        <HtmlMeta title={t("global:nav.map_search")} />
        {isMobile && (
          <MobileMapView
            hasPreviousPage={hasPreviousPage}
            hasNextPage={hasNextPage}
            isLoading={isLoading}
            mapRef={mapRef}
            onLoadPreviousPage={handleLoadPreviousPage}
            onLoadNextPage={handleLoadNextPage}
            onOpenFilters={handleOpenFiltersDialog}
            onSetSearchType={handleSetSearchType}
            searchType={searchType}
            totalItems={totalItems}
            users={users}
          />
        )}

        {!isMobile && (
          <DesktopMapView
            hasPreviousPage={hasPreviousPage}
            hasNextPage={hasNextPage}
            isLoading={isLoading}
            mapRef={mapRef}
            onLoadPreviousPage={handleLoadPreviousPage}
            onLoadNextPage={handleLoadNextPage}
            onOpenFilters={handleOpenFiltersDialog}
            onSetSearchType={handleSetSearchType}
            searchType={searchType}
            totalItems={totalItems}
            users={users}
          />
        )}
      </MapProvider>
      <FilterDialog
        isOpen={isFiltersOpen}
        onCloseDialog={handleCloseFiltersDialog}
      />
    </SearchPageContainer>
  );
}
