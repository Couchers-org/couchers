import { styled } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import Map, { API_BASE_URL } from "components/Map";
import { Point } from "geojson";
import { GeoJSONSource, MapLayerMouseEvent } from "maplibre-gl";
import { User } from "proto/api_pb";
import { useCallback, useMemo, useState } from "react";
import { MapRef } from "react-map-gl/maplibre";

import { FlyToLocationProps, SearchQueryOptions } from "./SearchPage";
import { UNCLUSTERED_LAYER_ID } from "./utils/mapLayers";
import {
  getMapBounds,
  loadMapUserPins,
  setMapFeatureState,
  usersToGeoJSON,
} from "./utils/mapUtils";

interface MapViewProps {
  hasActiveFilters: boolean;
  isLoading: boolean;
  mapRef: React.RefObject<MapRef>;
  onClearSearchQuery: () => void;
  onSetSearchQuery: (searchQuery: SearchQueryOptions) => void;
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
  isLoading,
  mapRef,
  onClearSearchQuery,
  onSetSearchQuery,
  onSelectedUserIdClick,
  selectedUserIds,
  users = DEFAULT_USERS,
}: MapViewProps) => {
  const pins = usersToGeoJSON(users);
  const memoizedPins = useMemo(() => pins, [pins]);
  const zoomedOutDataSource = API_BASE_URL + "/geojson/users";

  const [zoom, setZoom] = useState<number>(1);

  // If zoomed in or has active filters, use the memoized pins form api query in SearchPage
  const pinsSource =
    zoom >= 5 || hasActiveFilters ? memoizedPins : zoomedOutDataSource;

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

          if (newZoom >= 5) {
            const bbox = getMapBounds(mapRef);

            onSetSearchQuery({
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
    [flyToLocation, mapRef, onSelectedUserIdClick, onSetSearchQuery, selectedUserIds],
  );

  const handleLoad = async () => {
    await loadMapUserPins(mapRef);
  };

  const handleMapMove = () => {
    // If zoom is too large an area, don't reload pins
    if (zoom && zoom >= 5) {
      const bbox = getMapBounds(mapRef);

      onSetSearchQuery({
        bbox,
      });
    }
  };

  const handleZoomIn = (newZoom: number) => {
    if (newZoom >= 5) {
      const bbox = getMapBounds(mapRef);

      onSetSearchQuery({
        bbox,
      });
    }
  };

  const handleZoomOut = (newZoom: number) => {
    if (newZoom >= 5) {
      const bbox = getMapBounds(mapRef);

      onSetSearchQuery({
        bbox,
      });
    }

    if (zoom >= 5 && newZoom < 5) {
      onClearSearchQuery();
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
