import "maplibre-gl/dist/maplibre-gl.css";

import {
  clusterCountLayer,
  clusterLayer,
  unclusteredPointLayer,
} from "features/search/utils/mapLayers";
import { MapLayerMouseEvent } from "maplibre-gl";
import React from "react";
import {
  Layer,
  Map as MaplibreMap,
  MapRef,
  NavigationControl,
  Source,
} from "react-map-gl/maplibre";

interface MapProps {
  grow?: boolean;
  hash?: boolean;
  mapRef: React.RefObject<MapRef>;
  onClick: (ev: MapLayerMouseEvent) => void;
  onLoad: () => void;
  pins: GeoJSON.FeatureCollection;
}

const Map = ({ grow, hash, mapRef, onClick, onLoad, pins }: MapProps) => {
  const handleMapLoad = () => {
    if (mapRef.current) {
      onLoad();
    }
  };

  const handleMapClick = async (ev: MapLayerMouseEvent) => {
    onClick(ev);
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
        hash={hash}
        ref={mapRef}
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
        <NavigationControl position="top-right" showCompass={false} />
      </MaplibreMap>
    </>
  );
};

export default Map;
