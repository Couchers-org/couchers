import { debounce, styled } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import Map, { API_BASE_URL } from "components/Map";
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

const DEFAULT_USERS: User.AsObject[] = [];

const MapView = ({
  isLoading,
  mapRef,
  onZoomIn,
  onZoomOut,
  users = DEFAULT_USERS,
}: MapViewProps) => {
  const pins = usersToGeoJSON(users);
  const memoizedPins = useMemo(() => pins, [pins]);
  const zoomedOutDataSource = API_BASE_URL + "/geojson/users";

  const {
    search: { bbox: searchQueryBbox, query },
    hasActiveFilters,
    selectedUserId,
    shouldSearchByUserId,
    uiOnly: { zoom },
  } = useMapSearchState();

  const { setMoveMapUIOnly, setSelectedUserId, setShowSearchThisAreaButton } =
    useMapSearchActions();

  const meetsSearchCriteria =
    hasActiveFilters ||
    searchQueryBbox !== undefined ||
    query !== undefined ||
    shouldSearchByUserId;

  // If zoomed in, has a location searched or has active filters, use the memoized pins form api query in SearchPage
  const pinsSource = meetsSearchCriteria ? memoizedPins : zoomedOutDataSource;

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
        if (newZoom - zoom > 5) {
          newZoom = zoom + 5;
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
