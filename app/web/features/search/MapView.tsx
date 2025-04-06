import { debounce, Snackbar, styled } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import IconButton from "components/IconButton";
import { CloseIcon } from "components/Icons";
import Map, { API_BASE_URL } from "components/Map";
import { useTranslation } from "i18n";
import { SEARCH } from "i18n/namespaces";
import { MapLayerMouseEvent } from "maplibre-gl";
import { User } from "proto/api_pb";
import { useCallback, useMemo, useState } from "react";
import { MapRef } from "react-map-gl/maplibre";

import { useMapSearchState } from "./state/mapSearchContext";
import { useMapSearchActions } from "./state/useMapSearchActions";
import { MAX_MAP_ZOOM_LEVEL_FOR_SEARCH } from "./utils/constants";
import { UNCLUSTERED_LAYER_ID } from "./utils/mapLayers";
import {
  getMapBounds,
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
  const { t } = useTranslation([SEARCH]);
  const [showSnackbar, setShowSnackbar] = useState(false);

  const pins = usersToGeoJSON(users);
  const memoizedPins = useMemo(() => pins, [pins]);
  const zoomedOutDataSource = API_BASE_URL + "/geojson/users";

  const {
    search: { bbox },
    hasActiveFilters,
    hasSearchInputValue,
    selectedUserId,
    zoom,
  } = useMapSearchState();

  const { setMoveMap, setSearch, setZoom, setSelectedUserId } =
    useMapSearchActions();

  const meetsSearchCriteria =
    hasActiveFilters || hasSearchInputValue || bbox !== undefined;

  // If zoomed in, has a location searched or has active filters, use the memoized pins form api query in SearchPage
  const pinsSource = meetsSearchCriteria ? memoizedPins : zoomedOutDataSource;

  const debouncedZoomIn = useMemo(
    () =>
      debounce((newZoom: number) => {
        if (
          zoom < MAX_MAP_ZOOM_LEVEL_FOR_SEARCH &&
          newZoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH
        ) {
          const bbox = getMapBounds(mapRef);

          setSearch({ bbox });
        }
        setZoom(newZoom);
      }, 500),
    [zoom, mapRef, setSearch, setZoom],
  );

  const handleZoomIn = useCallback(
    (newZoom: number) => {
      debouncedZoomIn(newZoom);
    },
    [debouncedZoomIn],
  );

  const handleZoomOut = debounce((newZoom: number) => {
    setZoom(newZoom);
  }, 500);

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
          onZoomIn: handleZoomIn,
          zoom,
        });
      } else if (layerId === UNCLUSTERED_LAYER_ID) {
        if (zoom < MAX_MAP_ZOOM_LEVEL_FOR_SEARCH) {
          setShowSnackbar(true);
          return;
        }

        onPointClick({
          center: ev.lngLat,
          feature,
          mapRef,
          selectedUserId,
          setSelectedUserId,
        });
      }
    },
    [handleZoomIn, mapRef, selectedUserId, setSelectedUserId, zoom],
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

  const handleMapMove = debounce(() => {
    setMoveMap();
  }, 600);

  const handleZoomControlInClick = (newZoom: number) => {
    setZoom(newZoom);
    mapRef.current?.easeTo({
      zoom: newZoom,
      duration: 2000,
    });

    handleZoomIn(newZoom);
  };

  const handleZoomControlOutClick = (newZoom: number) => {
    setZoom(newZoom);
    mapRef.current?.easeTo({
      zoom: newZoom,
      duration: 2000,
    });
  };

  const handleSnackbarClose = () => {
    setShowSnackbar(false);
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
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomControlInClick={handleZoomControlInClick}
        onZoomControlOutClick={handleZoomControlOutClick}
        pins={pinsSource}
      />
      <Snackbar
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        message={t("search:zoom_in_to_select_user")}
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleSnackbarClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </>
  );
};

export default MapView;
