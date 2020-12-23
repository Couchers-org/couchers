import * as React from "react";
import PageTitle from "../../components/PageTitle";
import Map from "../../components/Map";
import { LngLat, Map as MapboxMap } from "mapbox-gl";

import { addClusteredUsersToMap } from "./ClusteredUsers";

export default function MapPage() {
  const initializeMap = (map: MapboxMap) => {
    map.on("load", () => {
      addClusteredUsersToMap(map);
    });
  };
  return (
    <>
      <PageTitle>MapPage</PageTitle>
      <div
        style={{ maxWidth: "100vw", height: "80vh", border: "1px solid black" }}
      >
        <Map
          initialZoom={1}
          initialCenter={new LngLat(0, 0)}
          grow
          postMapInitialize={initializeMap}
        />
      </div>
    </>
  );
}
