import { debounce, styled } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import Map, { API_BASE_URL } from "components/Map";
import { MapLayerMouseEvent, MapSourceDataEvent } from "maplibre-gl";
import { User } from "proto/api_pb";
import { useCallback, useMemo, useState } from "react";
import { MapRef } from "react-map-gl/maplibre";

import { useMapSearchState } from "./state/mapSearchContext";
import { useMapSearchActions } from "./state/useMapSearchActions";
import {
  SOURCE_CLUSTERED_USERS_ID,
  UNCLUSTERED_LAYER_ID,
} from "./utils/mapLayers";
import {
  loadMapUserPins,
  onClusterClick,
  onPointClick,
  usersToGeoJSON,
} from "./utils/mapUtils";

interface MapViewProps {
  isLoading: boolean;
  mapRef: React.RefObject<MapRef>;
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
    selectedUserId,
    zoom,
  } = useMapSearchState();

  const { setMoveMap, setZoom, setSelectedUserId } = useMapSearchActions();

  const meetsSearchCriteria =
    hasActiveFilters || hasSearchInputValue || bbox !== undefined;

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
        onClusterClick({
          center: ev.lngLat,
          feature,
          mapRef,
          setZoom,
          zoom,
        });
      } else if (layerId === UNCLUSTERED_LAYER_ID) {
        onPointClick({
          feature,
          mapRef,
          selectedUserId,
          setSelectedUserId,
          zoom,
        });
      }
    },
    [mapRef, selectedUserId, setSelectedUserId, setZoom, zoom],
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
    setMoveMap();
  }, 600);

  const handleZoomIn = (newZoom: number) => {
    setZoom(newZoom);
    mapRef.current?.easeTo({
      zoom: newZoom,
      duration: 2000,
    });
  };

  const handleZoomOut = (newZoom: number) => {
    setZoom(newZoom);
    mapRef.current?.easeTo({
      zoom: newZoom,
      duration: 2000,
    });
  };

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
        onSetZoom={setZoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onSourceDataLoading={handleMapSourceDataLoading}
        pins={pinsSource}
      />
    </>
  );
};

export default MapView;
