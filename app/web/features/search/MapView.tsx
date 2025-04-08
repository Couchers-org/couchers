import { debounce, styled } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import Map, { API_BASE_URL } from "components/Map";
import { GeoJSONSource, LngLatLike, MapLayerMouseEvent } from "maplibre-gl";
import { User } from "proto/api_pb";
import { useCallback, useEffect, useMemo } from "react";
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

  const {
    search: { bbox: searchQueryBbox, query },
    hasActiveFilters,
    selectedUserId,
    shouldSearchByUserId,
    uiOnly: { center, zoom },
  } = useMapSearchState();

  const { setInitialState, setMoveMapUIOnly, setSelectedUserId } =
    useMapSearchActions();

  const meetsSearchCriteria =
    hasActiveFilters ||
    searchQueryBbox !== undefined ||
    query !== "" ||
    shouldSearchByUserId;

  // If zoomed in, has a location searched or has active filters, use the memoized pins form api query in SearchPage
  const pinsSource = meetsSearchCriteria ? memoizedPins : zoomedOutDataSource;

  // We set zoom, center and bbox as single source of truth in the reducer
  // Then check for changes here to relocate map
  useEffect(() => {
    if (center || (zoom && zoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH)) {
      console.log("ZOOMING IN USE EFFECT", center, zoom);
      mapRef.current?.easeTo({
        ...(center && { center }),
        ...(zoom && { zoom }),
        duration: 2000,
      });
    }
  }, [center, mapRef, zoom]);

  // @TODO: GET ZOOM WORKING WHEN BELOW THRESHOLD AND ZOOM OUT INFINITE LOOP

  useEffect(() => {
    if (
      zoom < MAX_MAP_ZOOM_LEVEL_FOR_SEARCH &&
      !shouldSearchByUserId &&
      !query
    ) {
      console.log("RESETTING INITIAL STATE");
      setInitialState();
    }
  }, [query, setInitialState, shouldSearchByUserId, zoom]);

  const debouncedZoomIn = useMemo(
    () =>
      debounce((newZoom: number, center?: LngLatLike) => {
        if (
          zoom! < MAX_MAP_ZOOM_LEVEL_FOR_SEARCH &&
          newZoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH
        ) {
          setMoveMapUIOnly({ center, zoom: newZoom });
        } else {
          setMoveMapUIOnly({ zoom: newZoom });
        }
      }, 500),
    [zoom, setMoveMapUIOnly],
  );

  const handleZoomIn = useCallback(
    (newZoom: number, center?: LngLatLike) => {
      debouncedZoomIn(newZoom, center);
    },
    [debouncedZoomIn],
  );

  const handleZoomOut = debounce((newZoom: number) => {
    setMoveMapUIOnly({ zoom: newZoom });
  }, 500);

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

        handleZoomIn(newZoom, ev.lngLat);
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
    [handleZoomIn, mapRef, selectedUserId, setSelectedUserId, zoom],
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
    setMoveMapUIOnly({ bbox, zoom });
  }, 600);

  const handleZoomControlInClick = (newZoom: number) => {
    handleZoomIn(newZoom);
  };

  const handleZoomControlOutClick = (newZoom: number) => {
    handleZoomOut(newZoom);
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
    </>
  );
};

export default MapView;
