import { styled } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import Map, { API_BASE_URL } from "components/Map";
import { Point } from "geojson";
import { GeoJSONSource, MapLayerMouseEvent } from "maplibre-gl";
import { User } from "proto/api_pb";
import { useCallback, useMemo, useState } from "react";
import { MapRef } from "react-map-gl/maplibre";

import {
  FlyToLocationProps,
  InitialSearchLocation,
  SearchOptions,
} from "./SearchPage";
import { MAX_MAP_ZOOM_LEVEL_FOR_SEARCH } from "./utils/constants";
import { UNCLUSTERED_LAYER_ID } from "./utils/mapLayers";
import {
  getMapBounds,
  loadMapUserPins,
  meetsApiSearchCriteria,
  setMapFeatureState,
  usersToGeoJSON,
} from "./utils/mapUtils";

interface MapViewProps {
  hasActiveFilters: boolean;
  hasSearchInputValue: boolean;
  initialBbox: InitialSearchLocation["bbox"];
  isLoading: boolean;
  mapRef: React.RefObject<MapRef>;
  onClearSearchInputValue: () => void;
  onSetSearch: (search: SearchOptions) => void;
  onSelectedUserIdClick: (userId: number) => void;
  selectedUserIds: User.AsObject["userId"][];
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
  hasActiveFilters,
  hasSearchInputValue,
  initialBbox,
  isLoading,
  mapRef,
  onClearSearchInputValue,
  onSetSearch,
  onSelectedUserIdClick,
  selectedUserIds,
  users = DEFAULT_USERS,
}: MapViewProps) => {
  const pins = usersToGeoJSON(users);
  const memoizedPins = useMemo(() => pins, [pins]);
  const zoomedOutDataSource = API_BASE_URL + "/geojson/users";

  const [zoom, setZoom] = useState<number>(1);

  // If zoomed in, has a location searched or has active filters, use the memoized pins form api query in SearchPage
  const pinsSource = meetsApiSearchCriteria({
    hasActiveFilters,
    hasSearchInputValue,
    zoom,
  })
    ? memoizedPins
    : zoomedOutDataSource;

  const flyToLocation = useCallback(
    ({ longitude, latitude, zoom }: FlyToLocationProps) => {
      mapRef.current?.flyTo({
        center: [longitude, latitude],
        zoom: zoom || 12,
        duration: 2000,
      });
    },
    [mapRef],
  );

  const handleSetZoom = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const handleClick = useCallback(
    async (ev: MapLayerMouseEvent) => {
      const features = mapRef.current?.queryRenderedFeatures(ev.point);
      const feature = features ? features[0] : undefined;

      if (!feature) return;

      const layerId = feature?.layer.id;
      const isCluster = feature?.properties.cluster;

      if (isCluster) {
        const source = mapRef.current?.getSource(
          "clustered-users",
        ) as GeoJSONSource;

        const newZoom = await source.getClusterExpansionZoom(
          feature.properties.cluster_id,
        );

        if (newZoom) {
          const point = feature.geometry as Point;

          flyToLocation({
            latitude: point.coordinates[1],
            longitude: point.coordinates[0],
            zoom: newZoom,
          });

          if (
            newZoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH &&
            !hasSearchInputValue
          ) {
            const bbox = getMapBounds(mapRef);

            onSetSearch({
              bbox,
            });
          }
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
      flyToLocation,
      hasSearchInputValue,
      mapRef,
      onSelectedUserIdClick,
      onSetSearch,
      selectedUserIds,
    ],
  );

  const handleLoad = async () => {
    await loadMapUserPins(mapRef);

    // Zoom into initial bbox
    if (initialBbox) {
      mapRef.current?.fitBounds(initialBbox);
    }
  };

  //@TODO(NA): Should I debounce this in some way?
  const handleMapMove = () => {
    // If zoom is too large an area, don't reload pins
    if (zoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH && !hasSearchInputValue) {
      const bbox = getMapBounds(mapRef);

      onSetSearch({
        bbox,
      });
    }
  };

  const handleZoomIn = (newZoom: number) => {
    if (newZoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH && !hasSearchInputValue) {
      const bbox = getMapBounds(mapRef);

      onSetSearch({
        bbox,
      });
    }
  };

  const handleZoomOut = (newZoom: number) => {
    if (newZoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH && !hasSearchInputValue) {
      const bbox = getMapBounds(mapRef);

      onSetSearch({
        bbox,
      });
    }

    if (newZoom < MAX_MAP_ZOOM_LEVEL_FOR_SEARCH) {
      onClearSearchInputValue();
    }
  };

  return (
    <>
      {isLoading && (
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
        onSetZoom={handleSetZoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        pins={pinsSource}
      />
    </>
  );
};

export default MapView;
