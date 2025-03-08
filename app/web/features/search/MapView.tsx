import { debounce, styled } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import Map, { API_BASE_URL } from "components/Map";
import {
  GeoJSONSource,
  MapLayerMouseEvent,
  MapSourceDataEvent,
} from "maplibre-gl";
import { User } from "proto/api_pb";
import { useCallback, useMemo, useState } from "react";
import { MapRef } from "react-map-gl/maplibre";

import { SearchOptions } from "./SearchPage";
import { useMapSearchState } from "./state/mapSearchContext";
import { MAX_MAP_ZOOM_LEVEL_FOR_SEARCH } from "./utils/constants";
import {
  SOURCE_CLUSTERED_USERS_ID,
  UNCLUSTERED_LAYER_ID,
} from "./utils/mapLayers";
import {
  getMapBounds,
  loadMapUserPins,
  setMapFeatureState,
  usersToGeoJSON,
} from "./utils/mapUtils";

interface MapViewProps {
  isLoading: boolean;
  mapRef: React.RefObject<MapRef>;
  onClearSearchInputValue: () => void;
  onSetSearch: (search: SearchOptions) => void;
  onSelectedUserIdClick: (userId: number) => void;
  onSetZoom: (zoom: number) => void;
  users: User.AsObject[] | undefined;
}

const MapLoadingContainer = styled("div")(({ theme }) => ({
  position: "absolute",
  backgroundColor: "rgba(255, 255, 255, 0.7)",
  width: "100%",
  zIndex: 10,
  height: "100%",
}));

const DEFAULT_USERS: User.AsObject[] = [];

const MapView = ({
  isLoading,
  mapRef,
  onClearSearchInputValue,
  onSetSearch,
  onSelectedUserIdClick,
  onSetZoom,
  users = DEFAULT_USERS,
}: MapViewProps) => {
  const pins = usersToGeoJSON(users);
  const memoizedPins = useMemo(() => pins, [pins]);
  const zoomedOutDataSource = API_BASE_URL + "/geojson/users";

  const [isMapSourceDataLoading, setIsMapSourceDataLoading] =
    useState<boolean>(true);

  const {
    search: { bbox },
    hasActiveFilters,
    hasSearchInputValue,
    selectedUserIds,
    zoom,
  } = useMapSearchState();

  const meetsSearchCriteria =
    hasActiveFilters ||
    hasSearchInputValue ||
    zoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH;

  // If zoomed in, has a location searched or has active filters, use the memoized pins form api query in SearchPage
  const pinsSource = meetsSearchCriteria ? memoizedPins : zoomedOutDataSource;

  const handleClick = useCallback(
    async (ev: MapLayerMouseEvent) => {
      const features = mapRef.current?.queryRenderedFeatures(ev.point);
      const feature = features ? features[0] : undefined;

      if (!feature) return;

      const layerId = feature?.layer.id;
      const isCluster = feature?.properties.cluster;

      if (isCluster) {
        const source = mapRef.current?.getSource(
          SOURCE_CLUSTERED_USERS_ID,
        ) as GeoJSONSource;

        const newZoom = await source.getClusterExpansionZoom(
          feature.properties.cluster_id,
        );

        if (newZoom) {
          // Avoid excessive api calls if we already fetched more zoomed out
          if (
            zoom <= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH &&
            newZoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH &&
            !hasSearchInputValue
          ) {
            const bbox = getMapBounds(mapRef);

            onSetSearch({
              bbox,
            });
          }

          onSetZoom(newZoom);
          mapRef.current?.zoomIn();
        }
      }

      if (layerId === UNCLUSTERED_LAYER_ID) {
        const userId = feature.properties.id;

        if (selectedUserIds.includes(userId)) {
          setMapFeatureState(mapRef, userId, false);
        } else {
          setMapFeatureState(mapRef, userId, true);
        }

        onSelectedUserIdClick(userId);
      }
    },
    [
      hasSearchInputValue,
      mapRef,
      onSelectedUserIdClick,
      onSetSearch,
      onSetZoom,
      selectedUserIds,
      zoom,
    ],
  );

  const handleLoad = async () => {
    await loadMapUserPins(mapRef);

    // Zoom into initial bbox
    if (bbox) {
      mapRef.current?.fitBounds(bbox, {
        padding: 20,
        maxZoom: 12,
        duration: 2000,
      });
    }
  };

  const handleMapSourceDataLoading = (event: MapSourceDataEvent) => {
    if (!event.isSourceLoaded && event.sourceId === SOURCE_CLUSTERED_USERS_ID) {
      setIsMapSourceDataLoading(true);
    } else if (
      event.isSourceLoaded &&
      event.sourceId === SOURCE_CLUSTERED_USERS_ID
    ) {
      setIsMapSourceDataLoading(false);
    }
  };

  const handleMapMove = debounce(() => {
    // If zoom is too large an area, don't reload pins
    if (zoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH && !hasSearchInputValue) {
      const bbox = getMapBounds(mapRef);

      onSetSearch({
        bbox,
      });
    }
  }, 600);

  // Debounce avoids excessive api calls when button rapidly clicked, waits til end of burst
  const handleZoomIn = debounce((newZoom: number) => {
    // Avoid excessive api calls if already fetched for more zoomed out level
    if (
      zoom < MAX_MAP_ZOOM_LEVEL_FOR_SEARCH &&
      newZoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH &&
      !hasSearchInputValue
    ) {
      const bbox = getMapBounds(mapRef);

      onSetSearch({
        bbox,
      });
    }
  }, 600);

  const handleZoomOut = debounce((newZoom: number) => {
    if (newZoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH && !hasSearchInputValue) {
      const bbox = getMapBounds(mapRef);

      onSetSearch({
        bbox,
      });
    }

    if (newZoom < MAX_MAP_ZOOM_LEVEL_FOR_SEARCH) {
      onClearSearchInputValue();
    }
  }, 600);

  return (
    <>
      {(isLoading || isMapSourceDataLoading) && (
        <MapLoadingContainer>
          <CenteredSpinner minHeight="100%" />
        </MapLoadingContainer>
      )}
      <Map
        grow
        hash
        mapRef={mapRef}
        onClick={handleClick}
        onLoad={handleLoad}
        onMapMove={handleMapMove}
        onSetZoom={onSetZoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onSourceDataLoading={handleMapSourceDataLoading}
        pins={pinsSource}
      />
    </>
  );
};

export default MapView;
