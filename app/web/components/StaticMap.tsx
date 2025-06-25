import "maplibre-gl/dist/maplibre-gl.css";

import { styled, useMediaQuery } from "@mui/material";
import {
  clusterCountLayer,
  clusterLayer,
  SOURCE_CLUSTERED_USERS_ID,
  unclusteredPointLayer,
} from "features/search/utils/mapLayers";
import React from "react";
import { Layer, Map as MaplibreMap, Source } from "react-map-gl/maplibre";
import { theme } from "theme";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const MapWrapper = styled("div")(({ theme }) => ({
  height: 600,
  width: "100%",
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
}));

const StaticMap = () => {
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
        mapStyle="https://cdn.couchers.org/maps/couchers-basemap-style-v1.json"
        interactiveLayerIds={clusterLayer.id ? [clusterLayer.id] : []}
        hash={true}
      >
        <Source
          id={SOURCE_CLUSTERED_USERS_ID}
          cluster={true}
          clusterRadius={50}
          data={API_BASE_URL + "/geojson/public-users"}
          promoteId="id"
          type={"geojson"}
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...unclusteredPointLayer} />
        </Source>
      </MaplibreMap>
    </MapWrapper>
  );
};

export default StaticMap;
