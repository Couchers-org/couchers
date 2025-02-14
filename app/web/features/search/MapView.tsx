import { styled } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import Map from "components/Map";
import { Point } from "geojson";
import { GeoJSONSource, MapLayerMouseEvent } from "maplibre-gl";
import { User } from "proto/api_pb";
import { useCallback } from "react";
import { MapRef } from "react-map-gl/maplibre";

import { FlyToLocationProps } from "./SearchPage";
import { CLUSTER_LAYER_ID, UNCLUSTERED_LAYER_ID } from "./utils/mapLayers";
import {
  loadMapUserPins,
  setMapFeatureState,
  usersToGeoJSON,
} from "./utils/mapUtils";

interface MapViewProps {
  flyToLocation: (location: FlyToLocationProps) => void;
  isLoading: boolean;
  mapRef: React.RefObject<MapRef>;
  onSelectedUserIdClick: (userId: number) => void;
  selectedUserIds: User.AsObject["userId"][];
  users: User.AsObject[] | undefined;
}

const StyledMapWrapper = styled("div")(({ theme }) => ({
  position: "absolute",
  width: "100%",
  height: "100%",
}));

const MapLoadingContainer = styled("div")(({ theme }) => ({
  position: "absolute",
  backgroundColor: "rgba(255, 255, 255, 0.7)",
  width: "100%",
  zIndex: 2,
  height: `calc(100% - ${theme.shape.navPaddingXs})`,

  [theme.breakpoints.up("sm")]: {
    height: `calc(100% - ${theme.shape.navPaddingSmUp})`,
  },
}));

const DEFAULT_USERS: User.AsObject[] = [];

const MapView = ({
  flyToLocation,
  isLoading,
  mapRef,
  onSelectedUserIdClick,
  selectedUserIds,
  users = DEFAULT_USERS,
}: MapViewProps) => {
  // @TODO(NA) Should I useMemo this?
  const pins = usersToGeoJSON(users);

  const handleClick = useCallback(
    async (ev: MapLayerMouseEvent) => {
      const features = mapRef.current?.queryRenderedFeatures(ev.point);
      const feature = features ? features[0] : undefined;

      if (!feature) return;

      const clusterId = feature?.properties.cluster_id;
      const layerId = feature?.layer.id;

      if (clusterId === CLUSTER_LAYER_ID) {
        const source = mapRef.current?.getSource(
          "clustered-users",
        ) as GeoJSONSource;

        const zoom = await source.getClusterExpansionZoom(
          feature.properties.cluster_id,
        );

        if (zoom) {
          const point = feature.geometry as Point;

          flyToLocation({
            latitude: point.coordinates[1],
            longitude: point.coordinates[0],
            zoom,
          });
        }
      }

      if (layerId === UNCLUSTERED_LAYER_ID) {
        const userId = feature.properties.id;
        const point = feature.geometry as Point;

        const [longitude, latitude] = point.coordinates;

        flyToLocation({
          latitude,
          longitude,
          zoom: 12.5,
        });

        if (selectedUserIds.includes(userId)) {
          setMapFeatureState(mapRef, userId, false);
        } else {
          setMapFeatureState(mapRef, userId, true);
        }

        onSelectedUserIdClick(userId);
      }
    },
    [flyToLocation, mapRef, onSelectedUserIdClick, selectedUserIds],
  );

  const handleLoad = async () => {
    await loadMapUserPins(mapRef);
  };

  return (
    <StyledMapWrapper>
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
        pins={pins}
      />
    </StyledMapWrapper>
  );
};

export default MapView;
