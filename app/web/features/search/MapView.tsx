import { styled } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import Map from "components/Map";
import { Point } from "geojson";
import { GeoJSONSource, MapLayerMouseEvent } from "maplibre-gl";
import { User } from "proto/api_pb";
import { useCallback } from "react";
import { MapRef, ViewState } from "react-map-gl/maplibre";

import userPin from "./resources/userPin.png";
import { FilterKey, FilterValue } from "./SearchPage";
import { Coordinates } from "./utils/constants";
import { CLUSTER_LAYER_ID, UNCLUSTERED_LAYER_ID } from "./utils/mapLayers";
import { usersToGeoJSON } from "./utils/mapUtils";

interface MapViewProps {
  bbox: Coordinates;
  isLoading: boolean;
  mapRef: React.RefObject<MapRef>;
  onFiltersChange: (key: FilterKey, value: FilterValue) => void;
  onViewStateChange: (viewState: ViewState) => void;
  selectedUserId: number | undefined;
  users: User.AsObject[] | undefined;
  viewState: ViewState;
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
  isLoading,
  mapRef,
  onFiltersChange,
  onViewStateChange,
  selectedUserId,
  users = DEFAULT_USERS,
  viewState,
}: MapViewProps) => {
  // @TODO(NA) Should I useMemo this?
  const pins = usersToGeoJSON(users);

  // const previousSelectedUserId = usePrevious(selectedUserId);

  const handleClick = useCallback(
    async (ev: MapLayerMouseEvent) => {
      ev.preventDefault();

      const feature = ev.features?.[0];

      if (!feature) return;

      const clusterId = feature?.properties.cluster_id;

      if (clusterId === CLUSTER_LAYER_ID) {
        const source = mapRef.current?.getSource(
          "clustered-users",
        ) as GeoJSONSource;

        const zoom = await source.getClusterExpansionZoom(
          feature.properties.cluster_id,
        );

        if (zoom) {
          const point = feature.geometry as Point;

          onViewStateChange({
            ...viewState,
            latitude: point.coordinates[1],
            longitude: point.coordinates[0],
            zoom,
          });
        }
      }

      if (clusterId === UNCLUSTERED_LAYER_ID) {
        const props = ev.features?.[0].properties;
        const geom = ev.features?.[0].geometry as Point;

        if (!props || !geom) return;

        const userId = props.id;

        const [lng, lat] = geom.coordinates;

        onViewStateChange({
          ...viewState,
          latitude: lat,
          longitude: lng,
          zoom: 12,
        });

        onFiltersChange("selectedUserId", userId);
      }
    },
    [mapRef, onFiltersChange, onViewStateChange, viewState],
  );

  const handleLoad = async () => {
    try {
      const image = await mapRef.current?.loadImage(userPin.src);

      if (mapRef.current?.hasImage("user-pin")) return;

      if (image) {
        mapRef.current?.addImage("user-pin", image.data, { sdf: true });
      }
    } catch (error) {
      throw error;
    }
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
        onViewStateChange={onViewStateChange}
        pins={pins}
        viewState={viewState}
      />
    </StyledMapWrapper>
  );
};

export default MapView;
