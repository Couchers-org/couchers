import * as React from "react";
import PageTitle from "../../components/PageTitle";
import Map from "../../components/Map";
import { userRoute } from "../../AppRoutes";
import { LngLat, Map as MapboxMap } from "mapbox-gl";
import { useHistory, useLocation } from "react-router-dom";

import { addClusteredUsersToMap } from "./ClusteredUsers";

export default function MapPage() {
  const history = useHistory();

  const location = useLocation();

  const userClicked = (ev: any) => {
    const username = ev.features[0].properties.username
    history.push(`${userRoute}/${username}`, location.state);
  };

  const initializeMap = (map: MapboxMap) => {
    map.on("load", () => {
      addClusteredUsersToMap(map, userClicked);
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
