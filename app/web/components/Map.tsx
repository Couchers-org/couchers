import "maplibre-gl/dist/maplibre-gl.css";

import {
  clusterCountLayer,
  clusterLayer,
  UNCLUSTERED_LAYER_ID,
  unclusteredPointLayer,
} from "features/search/utils/mapLayers";
import { MapLayerMouseEvent, RequestParameters } from "maplibre-gl";
import React from "react";
import {
  Layer,
  Map as MaplibreMap,
  MapRef,
  NavigationControl,
  Source,
} from "react-map-gl/maplibre";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface MapProps {
  grow?: boolean;
  hash?: boolean;
  mapRef: React.RefObject<MapRef>;
  onClick: (ev: MapLayerMouseEvent) => void;
  onLoad: () => void;
  onMapMove: () => void;
  onNavControlClick: () => void;
  pins: string | GeoJSON.FeatureCollection;
}

const Map = ({
  grow,
  hash,
  mapRef,
  onClick,
  onLoad,
  onMapMove,
  onNavControlClick,
  pins,
}: MapProps) => {
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

  const handleNavControlClick = () => {
    onNavControlClick();
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
        hash={hash}
        ref={mapRef}
        transformRequest={transformRequest}
      >
        <Source
          id="clustered-users"
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
        <div
          id="nav-control"
          onClick={handleNavControlClick}
          style={{
            position: "absolute",
            right: 10,
            top: 10,
            zIndex: 4,
            height: "80px",
            width: "40px",
          }}
        >
          <NavigationControl position="top-right" showCompass={false} />
        </div>
      </MaplibreMap>
    </>
  );
};

export default Map;
