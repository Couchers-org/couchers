import "maplibre-gl/dist/maplibre-gl.css";

import {
  clusterCountLayer,
  clusterLayer,
  UNCLUSTERED_LAYER_ID,
  unclusteredPointLayer,
} from "features/search/utils/mapLayers";
import { MapLayerMouseEvent } from "maplibre-gl";
import React, { useState } from "react";
import {
  Layer,
  Map as MaplibreMap,
  MapRef,
  NavigationControl,
  Source,
} from "react-map-gl/maplibre";
import { theme } from "theme";
import { LiteUser } from "proto/api_pb";
import { Tooltip } from "@mui/material";
import UserSummary from "./UserSummary";
import { routeToUser } from "routes";

interface MapProps {
  enablePinTooltip: boolean;
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
  enablePinTooltip,
}: MapProps) => {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: React.ReactNode;
  }>({
    visible: false,
    x: 0,
    y: 0,
    content: null,
  });

  const handleMapLoad = () => {
    if (mapRef.current) {
      onLoad();
    }
  };

  const handleMapClick = async (event: MapLayerMouseEvent) => {
    if (!enablePinTooltip) {
      onClick(event);
      return;
    }

    const map = mapRef.current;
    if (!map) return;

    const features = map.queryRenderedFeatures(event.point, {
      layers: [UNCLUSTERED_LAYER_ID], // Make sure the pins are in this layer
    });

    if (features.length > 0) {
      const feature = features[0];
      const username = feature.properties?.username;
      const userProfileLink = `${process.env.NEXT_PUBLIC_CONSOLE_BASE_URL}/user/${username}`;

      if (userProfileLink) {
        const userUrl = routeToUser(username);
        const absoluteUrl = `${window.location.origin}${userUrl}`;

        window.open(absoluteUrl, "_blank", "noopener,noreferrer");
      }
    }
  };

  const handleMoveMap = () => {
    onMapMove();
  };

  // Function to handle mousemove and change cursor to pointer when over pins
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

      if (!enablePinTooltip) return;

      // Get the data for the tooltip (example: use properties from the pin data)
      const feature = features[0];

      const tooltipContent = feature.properties ? (
        <Tooltip title="">
          <UserSummary
            user={feature.properties as LiteUser.AsObject}
            smallAvatar
          />
        </Tooltip>
      ) : (
        "No name"
      );

      setTooltip({
        visible: true,
        x: event.point.x,
        y: event.point.y,
        content: tooltipContent,
      });
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
        onDragEnd={handleMoveMap}
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
        <NavigationControl position="top-right" showCompass={false} />
      </MaplibreMap>
      {tooltip.visible && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x + 10,
            top: tooltip.y + 10,
            background: theme.palette.common.black,
            color: "white",
            padding: "5px",
            borderRadius: "5px",
            pointerEvents: "none", // To ensure the tooltip does not interfere with map interactions
            zIndex: 10, // Ensure the tooltip is above map elements
          }}
        >
          {tooltip.content}
        </div>
      )}
    </>
  );
};

export default Map;
