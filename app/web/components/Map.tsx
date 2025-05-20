import "maplibre-gl/dist/maplibre-gl.css";

import { useMediaQuery } from "@mui/system";
import { useMapSearchState } from "features/search/state/mapSearchContext";
import {
  clusterCountLayer,
  clusterLayer,
  SOURCE_CLUSTERED_USERS_ID,
  UNCLUSTERED_LAYER_ID,
  unclusteredPointLayer,
} from "features/search/utils/mapLayers";
import ZoomControl from "features/search/ZoomControl";
import { MapLayerMouseEvent, RequestParameters } from "maplibre-gl";
import React, { useRef } from "react";
import {
  Layer,
  Map as MaplibreMap,
  MapRef,
  Source,
  ViewStateChangeEvent,
} from "react-map-gl/maplibre";
import { theme } from "theme";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface MapProps {
  grow?: boolean;
  hash?: boolean;
  mapRef: React.RefObject<MapRef>;
  onClick: (ev: MapLayerMouseEvent) => void;
  onLoad: () => void;
  onMapMove: () => void;
  onZoomIn: (newZoom: number) => void;
  onZoomOut: (newZoom: number) => void;
  onZoomControlInClick: (newZoom: number) => void;
  onZoomControlOutClick: (newZoom: number) => void;
  pins: string | GeoJSON.FeatureCollection;
}

const Map = ({
  grow,
  hash,
  mapRef,
  onClick,
  onLoad,
  onMapMove,
  onZoomIn,
  onZoomOut,
  onZoomControlInClick,
  onZoomControlOutClick,
  pins,
}: MapProps) => {
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isZoomFromControlRef = useRef(false);

  const {
    uiOnly: { zoom },
  } = useMapSearchState();

  const handleMapLoad = () => {
    if (mapRef.current) {
      onLoad();
    }
  };

  const handleMapClick = async (event: MapLayerMouseEvent) => {
    onClick(event);
  };

  const handleDragEnd = () => {
    onMapMove();
  };

  const handleMouseMove = (event: MapLayerMouseEvent) => {
    const map = mapRef.current;
    if (!map) return;

    // Query the features (pins) under the mouse pointer
    const features = map.queryRenderedFeatures(event.point, {
      layers: [UNCLUSTERED_LAYER_ID], // Make sure pins are in this layer
    });

    // If there are any pins under the mouse, change cursor to pointer
    if (features.length > 0) {
      map.getCanvas().style.cursor = "pointer";
    }
  };

  const handleSetZoom = (viewState: ViewStateChangeEvent) => {
    if (isZoomFromControlRef.current) {
      isZoomFromControlRef.current = false; // reset the flag
      return; // skip regular zoom logic since already handled
    }

    if (viewState.viewState.zoom === zoom) return;

    const isZoomIn = viewState.viewState.zoom > zoom;
    const isZoomOut = viewState.viewState.zoom < zoom;

    if (isZoomIn) {
      onZoomIn(viewState.viewState.zoom);
    }

    if (isZoomOut) {
      onZoomOut(viewState.viewState.zoom);
    }
  };

  /*
    Allows sending cookies (counted as sensitive "credentials") on cross-origin requests when we grab GeoJSON/other data from the API.
    Those APIs will return an error if the session cookie is not set as these APIs are secure and not public.
    */
  const transformRequest = (url: string): RequestParameters => {
    if (url.startsWith(API_BASE_URL)) {
      return {
        credentials: "include",
        url,
      };
    }
    return { url };
  };

  const handleZoomControlInClick = (newZoom: number) => {
    isZoomFromControlRef.current = true;
    onZoomControlInClick(newZoom);
  };

  const handleZoomControlOutClick = (newZoom: number) => {
    isZoomFromControlRef.current = true;
    onZoomControlOutClick(newZoom);
  };

  return (
    <>
      <MaplibreMap
        id="map"
        style={{
          height: grow ? "100%" : "200px",
          width: grow ? "100%" : "400px",
        }}
        interactive={true}
        mapStyle="https://cdn.couchers.org/maps/couchers-basemap-style-v1.json"
        interactiveLayerIds={clusterLayer.id ? [clusterLayer.id] : []}
        onClick={handleMapClick}
        onLoad={handleMapLoad}
        onDragEnd={handleDragEnd}
        onMouseMove={handleMouseMove}
        onZoomEnd={handleSetZoom}
        hash={hash}
        ref={mapRef}
        transformRequest={transformRequest}
        {...(isMobile && { attributionControl: false })}
      >
        <Source
          id={SOURCE_CLUSTERED_USERS_ID}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={50}
          data={pins}
          promoteId="id"
          type={"geojson"}
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...unclusteredPointLayer} />
        </Source>
        {/** WHY BUILD OUR OWN ZOOM CONTROL? The built in NavigationControl component from react-map-gl doesn't offer a
         * click event, nor does the underlying map-libre. We need a click event to control the api queries for the pins
         * and user cards on the map. */}
        <ZoomControl
          mapRef={mapRef}
          onZoomIn={handleZoomControlInClick}
          onZoomOut={handleZoomControlOutClick}
          isZoomFromControlRef={isZoomFromControlRef}
        />
      </MaplibreMap>
    </>
  );
};

export default Map;
