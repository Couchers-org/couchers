import { styled } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import Map from "components/Map";
import { LngLat, MapLayerMouseEvent } from "maplibre-gl";
import { MutableRefObject, useCallback, useEffect, useState } from "react";
import { Map as MaplibreMap } from "maplibre-gl";
import { useTranslation } from "i18n";
import { SEARCH } from "i18n/namespaces";

import { User } from "proto/api_pb";
import { Point } from "geojson";
import { addClusteredUsersToMap } from "./utils/mapUtils";
import { FilterKey, FilterValue } from "./SearchPage";
import { Coordinates } from "./utils/constants";
import { reRenderUsersOnMap } from "features/_search/users";

interface MapViewProps {
  bbox: Coordinates;
  isLoading: boolean;
  map: MutableRefObject<MaplibreMap | undefined>;
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
  map,
  onFiltersChange,
  selectedUserId,
  users,
  wasSearchPerformed,
}: MapViewProps) => {
  const { t } = useTranslation([SEARCH]);
  const [isMapStyleLoaded, setIsMapStyleLoaded] = useState(false);
  const [isMapSourceLoaded, setIsMapSourceLoaded] = useState(false);
  const [hasInitialLoadRun, setHasInitialLoadRun] = useState(false);

  const shouldReloadMap =
    isMapStyleLoaded &&
    isMapSourceLoaded &&
    hasInitialLoadRun &&
    wasSearchPerformed;

  const handleMapUserClick = useCallback(
    (ev: MapLayerMouseEvent) => {
      ev.preventDefault();

      const props = ev.features?.[0].properties;
      const geom = ev.features?.[0].geometry as Point;

      if (!props || !geom) return;

      const userId = props.id;

      const [lng, lat] = geom.coordinates;
      const lngLat = new LngLat(lng, lat);
      map.current?.flyTo({ center: lngLat, zoom: 12 });

      // @TODO(NA): This isn't working. selectedUserId is undefined when it gets here
      // Or are we okay keeping selected every userPin we clicked on until page reload
      //   if (selectedUserId) {
      //     map.current?.setFeatureState(
      //       { source: "clustered-users", id: selectedUserId },
      //       { selected: false },
      //     );
      //   }

      map.current?.setFeatureState(
        { source: "clustered-users", id: userId },
        { selected: true },
      );

      onFiltersChange("selectedUserId", userId);
    },
    [onFiltersChange, selectedUserId],
  );

  useEffect(() => {
    if (shouldReloadMap) {
      if (users) {
        const userIds = users.map((user) => user.userId);

        reRenderUsersOnMap(map.current!, userIds, handleMapUserClick);
      }
    }
  }, [handleMapUserClick, map, shouldReloadMap, users]);

  // Relocate map everytime boundingbox changes
  useEffect(() => {
    map.current?.fitBounds(bbox);
  }, [bbox]);

  // Initial Load
  useEffect(() => {
    if (isMapStyleLoaded && isMapSourceLoaded && !hasInitialLoadRun) {
      if (users) {
        const userIds = users.map((user) => user.userId);

        // @TODO - Switch to use the new function, doesn't work now for some reason
        reRenderUsersOnMap(map.current!, userIds, handleMapUserClick);
      }
      setHasInitialLoadRun(true);
    }
  }, [
    isLoading,
    setIsMapStyleLoaded,
    isMapSourceLoaded,
    users,
    handleMapUserClick,
  ]);

  const initializeMap = (newMap: MaplibreMap) => {
    map.current = newMap;
    newMap.on("load", () => {
      addClusteredUsersToMap(newMap);
    });

    newMap.on("styledata", function () {
      setIsMapStyleLoaded(true);
    });

    newMap.on("sourcedataloading", function (e) {
      if (e.sourceId === "clustered-users") {
        setIsMapSourceLoaded(true);
      }
    });
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
        postMapInitialize={initializeMap}
        hash
      />
    </StyledMapWrapper>
  );
};

export default MapView;
