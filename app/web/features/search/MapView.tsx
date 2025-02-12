import { styled } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import Map from "components/Map";
import { Point } from "geojson";
import { LngLat, MapLayerMouseEvent } from "maplibre-gl";
import { User } from "proto/api_pb";
import { useCallback, useEffect } from "react";
import { useMap } from "react-map-gl/maplibre";
import { usePrevious } from "utils/hooks";

import userPin from "./resources/userPin.png";
import { FilterKey, FilterValue } from "./SearchPage";
import { Coordinates } from "./utils/constants";
import { UNCLUSTERED_LAYER_ID } from "./utils/mapLayers";
import { reRenderUsersOnMap } from "./utils/mapUtils";

interface MapViewProps {
  bbox: Coordinates;
  isLoading: boolean;
  onFiltersChange: (key: FilterKey, value: FilterValue) => void;
  selectedUserId: number | undefined;
  users: User.AsObject[] | undefined;
  wasSearchPerformed: boolean | undefined;
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

const MapView = ({
  bbox,
  isLoading,
  onFiltersChange,
  selectedUserId,
  users,
  wasSearchPerformed,
}: MapViewProps) => {
  const stringifiedSortedUserIds = JSON.stringify(
    users?.map((user) => user.userId).sort(),
  );

  const { map } = useMap();

  const previousSelectedUserId = usePrevious(selectedUserId);

  const handleClick = useCallback(
    (ev: MapLayerMouseEvent) => {
      ev.preventDefault();

      const feature = ev.features?.[0];

      if (!feature) return;

      const clusterId = feature?.properties.cluster_id;

      if (clusterId === UNCLUSTERED_LAYER_ID) {
        const props = ev.features?.[0].properties;
        const geom = ev.features?.[0].geometry as Point;

        if (!props || !geom) return;

        const userId = props.id;

        const [lng, lat] = geom.coordinates;

        onFiltersChange("selectedUserId", userId);
      }
    },
    [onFiltersChange],
  );

  useEffect(() => {
    if (!map) return;

    const parsedUserIds = JSON.parse(stringifiedSortedUserIds);

    reRenderUsersOnMap(map, parsedUserIds, handleClick);
  }, [handleClick, map, stringifiedSortedUserIds]);

  const handleLoad = async () => {
    // Prevent re-adding the image if it already exists

    try {
      const image = await map?.loadImage(userPin.src);

      if (map?.hasImage("user-pin")) return;

      if (image) {
        map?.addImage("user-pin", image.data, { sdf: true });
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
        initialCenter={new LngLat(0, 0)}
        initialZoom={1}
        hash
        onClick={handleClick}
        onLoad={handleLoad}
      />
    </StyledMapWrapper>
  );
};

export default MapView;
