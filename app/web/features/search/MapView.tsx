import { Button, debounce, styled } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import Map, { API_BASE_URL } from "components/Map";
import { useTranslation } from "i18n";
import { SEARCH } from "i18n/namespaces";
import { GeoJSONSource, LngLatLike, MapLayerMouseEvent } from "maplibre-gl";
import { User } from "proto/api_pb";
import { useCallback, useMemo } from "react";
import { MapRef } from "react-map-gl/maplibre";

import { useMapSearchState } from "./state/mapSearchContext";
import { useMapSearchActions } from "./state/useMapSearchActions";
import { MAX_MAP_ZOOM_LEVEL_FOR_SEARCH } from "./utils/constants";
import {
  SOURCE_CLUSTERED_USERS_ID,
  UNCLUSTERED_LAYER_ID,
} from "./utils/mapLayers";
import {
  clearMapFeatureState,
  getMapBounds,
  loadMapUserPins,
  setMapFeatureState,
  usersToGeoJSON,
} from "./utils/mapUtils";

interface MapViewProps {
  isDrawerExpanded: boolean;
  isLoading: boolean;
  mapRef: React.RefObject<MapRef>;
  onZoomIn: (newZoom: number, center?: LngLatLike) => void;
  onZoomOut: (newZoom: number) => void;
  users: User.AsObject[] | undefined;
}

const MapLoadingContainer = styled("div")(({ theme }) => ({
  position: "absolute",
  backgroundColor: "rgba(255, 255, 255, 0.7)",
  width: "100%",
  zIndex: 10,
  height: "100%",
}));

const SearchThisAreaButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "isDrawerExpanded",
})<{ isDrawerExpanded: boolean }>(({ isDrawerExpanded, theme }) => ({
  backgroundColor: theme.palette.common.white,
  borderRadius: "20px",
  boxShadow: theme.shadows[4],
  padding: theme.spacing(1, 2),
  position: "absolute",
  top: isDrawerExpanded ? theme.spacing(2) : theme.spacing(9),
  zIndex: 10,
  left: "50%",
  transform: "translateX(-50%)",

  [theme.breakpoints.down("md")]: {
    top: theme.spacing(1),
    padding: theme.spacing(0.5, 1),
    fontSize: "0.8rem",
  },

  "&:hover": {
    backgroundColor: theme.palette.grey[200],
  },
}));

const DEFAULT_USERS: User.AsObject[] = [];

const MapView = ({
  isDrawerExpanded,
  isLoading,
  mapRef,
  onZoomIn,
  onZoomOut,
  users = DEFAULT_USERS,
}: MapViewProps) => {
  const { t } = useTranslation([SEARCH]);

  const pins = usersToGeoJSON(users);
  const memoizedPins = useMemo(() => pins, [pins]);
  const zoomedOutDataSource = API_BASE_URL + "/geojson/users";

  const {
    search: { bbox: searchQueryBbox, query },
    hasActiveFilters,
    selectedUserId,
    showSearchThisAreaButton,
    shouldSearchByUserId,
    uiOnly: { zoom },
  } = useMapSearchState();

  const {
    setMapQueryArea,
    setMoveMapUIOnly,
    setSelectedUserId,
    setShowSearchThisAreaButton,
  } = useMapSearchActions();

  const meetsSearchCriteria =
    hasActiveFilters ||
    searchQueryBbox !== undefined ||
    query !== undefined ||
    shouldSearchByUserId;

  // If zoomed in, has a location searched or has active filters, use the memoized pins form api query in SearchPage
  const pinsSource = meetsSearchCriteria ? memoizedPins : zoomedOutDataSource;

  const handleSearchThisAreaClick = () => {
    const bbox = getMapBounds(mapRef);
    setMapQueryArea(bbox);
  };

  const handleClick = useCallback(
    async (ev: MapLayerMouseEvent) => {
      const features = mapRef.current?.queryRenderedFeatures(ev.point);
      const feature = features ? features[0] : undefined;

      if (!feature) return;

      const layerId = feature?.layer.id;
      const isCluster = feature?.properties.cluster;

      clearMapFeatureState(mapRef);

      if (isCluster) {
        const source = mapRef.current?.getSource(
          SOURCE_CLUSTERED_USERS_ID,
        ) as GeoJSONSource;

        let newZoom = await source.getClusterExpansionZoom(
          feature.properties.cluster_id,
        );

        // prevent it from hyper zooming rapidly
        if (newZoom - zoom > 6) {
          newZoom = zoom + 6;
        }

        onZoomIn(newZoom, ev.lngLat);
      } else if (layerId === UNCLUSTERED_LAYER_ID) {
        const userId = feature.properties.id;

        if (selectedUserId === userId) {
          setMapFeatureState(mapRef, userId, false);
        } else {
          setMapFeatureState(mapRef, userId, true);
        }

        setSelectedUserId(userId);
      } else if (selectedUserId !== undefined) {
        setSelectedUserId(undefined);
      }
    },
    [mapRef, onZoomIn, selectedUserId, setSelectedUserId, zoom],
  );

  const handleLoad = async () => {
    await loadMapUserPins(mapRef);

    // Zoom into initial bbox
    if (searchQueryBbox) {
      mapRef.current?.fitBounds(searchQueryBbox, {
        padding: 20,
        maxZoom: 12,
        duration: 2000,
      });
    }
  };

  const handleMapMove = debounce(() => {
    const bbox = getMapBounds(mapRef);
    clearMapFeatureState(mapRef);
    setMoveMapUIOnly({ bbox });

    if (zoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH) {
      setShowSearchThisAreaButton(true);
    }
  }, 300);

  const handleZoomControlInClick = (newZoom: number) => {
    onZoomIn(newZoom);
  };

  const handleZoomControlOutClick = (newZoom: number) => {
    onZoomOut(newZoom);
  };

  return (
    <>
      {isLoading && (
        <MapLoadingContainer>
          <CenteredSpinner minHeight="100%" />
        </MapLoadingContainer>
      )}
      {showSearchThisAreaButton && (
        <SearchThisAreaButton
          isDrawerExpanded={isDrawerExpanded}
          onClick={handleSearchThisAreaClick}
        >
          {t("search:search_this_area")}
        </SearchThisAreaButton>
      )}
      <Map
        grow
        hash
        mapRef={mapRef}
        onClick={handleClick}
        onLoad={handleLoad}
        onMapMove={handleMapMove}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onZoomControlInClick={handleZoomControlInClick}
        onZoomControlOutClick={handleZoomControlOutClick}
        pins={pinsSource}
      />
    </>
  );
};

export default MapView;
