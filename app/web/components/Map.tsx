import "maplibre-gl/dist/maplibre-gl.css";

import {
  clusterCountLayer,
  clusterLayer,
  UNCLUSTERED_LAYER_ID,
  unclusteredPointLayer,
} from "features/search/utils/mapLayers";
import { MapLayerMouseEvent } from "maplibre-gl";
import React, { useRef } from "react";
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
  onMapMove: () => void;
  pins: GeoJSON.FeatureCollection;
}

const Map = ({
  grow,
  hash,
  mapRef,
  onClick,
  onLoad,
  onMapMove,
  pins,
}: MapProps) => {
  const navControlRef = useRef<HTMLDivElement | null>(null);

  const handleMapLoad = () => {
    if (mapRef.current) {
      mapRef.current
        .getContainer()
        .addEventListener("click", handleNavControlClick);

      onLoad();
    }
  };

  const handleMapClick = async (event: MapLayerMouseEvent) => {
    onClick(event);
  };

  const handleDragEnd = () => {
    const zoom = mapRef.current?.getZoom();

    if (zoom && zoom >= 5) {
      onMapMove();
    }
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
    console.log("navControlRef clicked");
    const zoom = mapRef.current?.getZoom();
    console.log("zoom", zoom);
    // Zoom is too large an area, don't reload pins
    if (zoom && zoom >= 5) {
      onMapMove();
    }
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
        {/* Wrap NavigationControl in a div to detect clicks */}
        <div ref={navControlRef}>
          <NavigationControl position="top-right" showCompass={false} />
        </div>{" "}
      </MaplibreMap>
    </>
  );
};

export default Map;
