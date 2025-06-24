import "maplibre-gl/dist/maplibre-gl.css";

import { styled } from "@mui/material";
import {
  clusterCountLayer,
  clusterLayer,
  SOURCE_CLUSTERED_USERS_ID,
  unclusteredPointLayer,
} from "features/search/utils/mapLayers";
import { RequestParameters } from "maplibre-gl";
import React from "react";
import { Layer, Map as MaplibreMap, Source } from "react-map-gl/maplibre";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const MapWrapper = styled("div")(({ theme }) => ({
  height: 600,
  width: theme.breakpoints.values.lg,
  position: "relative",
}));

const StaticMap = () => {
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
    <MapWrapper>
      <MaplibreMap
        id="map"
        initialViewState={{ zoom: 0.75 }}
        minZoom={0}
        style={{
          height: "100%",
          width: "100%",
        }}
        mapStyle="https://cdn.couchers.org/maps/couchers-basemap-style-v1.json"
        interactiveLayerIds={clusterLayer.id ? [clusterLayer.id] : []}
        hash={true}
        transformRequest={transformRequest}
        scrollZoom={false}
        doubleClickZoom={false}
        touchZoomRotate={false}
      >
        <Source
          id={SOURCE_CLUSTERED_USERS_ID}
          cluster={true}
          clusterRadius={50}
          data={API_BASE_URL + "/geojson/users"}
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
