import { styled, useMediaQuery } from "@mui/material";
import "maplibre-gl/dist/maplibre-gl.css";
import React, { useRef } from "react";
import {
  Layer,
  MapRef,
  Map as MaplibreMap,
  NavigationControl,
  Source,
} from "react-map-gl/maplibre";

import {
  USERS_SOURCE_ID,
  clusterCountLayer,
  clusterLayer,
  unclusteredPointLayer,
} from "@/features/search/utils/mapLayers";
import { loadMapUserPins } from "@/features/search/utils/mapUtils";
import { theme } from "@/theme";

const MapWrapper = styled("div")(({ theme }) => ({
  height: 500,
  width: "100%",
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
  margin: theme.spacing(3, 0),

  [theme.breakpoints.down("md")]: {
    height: 350,
  },
}));

const StaticMap = () => {
  const mapRef = useRef<MapRef | null>(null);

  const onLoad = () => {
    if (mapRef.current) {
      void loadMapUserPins(mapRef);
    }
  };

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const initialViewState = isMobile
    ? { zoom: 0, latitude: 10, longitude: 48 }
    : { zoom: 0.75, latitude: 0, longitude: 0 };

  return (
    <MapWrapper>
      <MaplibreMap
        id="map"
        initialViewState={initialViewState}
        minZoom={0}
        maxZoom={7}
        style={{
          height: "100%",
          width: "100%",
        }}
        mapStyle={`${Config.cdnBaseUrl}/maps/couchers-basemap-style-v1.json`}
        interactiveLayerIds={clusterLayer.id ? [clusterLayer.id] : []}
        hash={false}
        ref={mapRef}
        onLoad={onLoad}
        scrollZoom={false}
        {...(isMobile && { attributionControl: false })}
      >
        <Source
          id={USERS_SOURCE_ID}
          cluster={true}
          clusterRadius={50}
          data={Config.apiBaseUrl + "/geojson/public-users"}
          promoteId="id"
          type={"geojson"}
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...unclusteredPointLayer} />
        </Source>
        <NavigationControl position="top-right" showCompass={false} />
      </MaplibreMap>
    </MapWrapper>
  );
};

export default StaticMap;
