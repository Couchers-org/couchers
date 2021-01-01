import * as React from "react";
import { makeStyles } from "@material-ui/core";
import PageTitle from "../../components/PageTitle";
import Map from "../../components/Map";
import { userRoute } from "../../AppRoutes";
import { LngLat, Map as MapboxMap } from "mapbox-gl";
import { useHistory, useLocation } from "react-router-dom";

import { addCommunitiesToMap } from "./communities";
import { addPagesToMap } from "./pages";
import { addClusteredUsersToMap } from "./clusteredUsers";

const useStyles = makeStyles((theme) => ({
  root: {
    maxWidth: "100vw",
    height: "80vh",
    border: "1px solid black",
  },
}));

export default function MapPage() {
  const history = useHistory();

  const location = useLocation();

  const classes = useStyles();

  const handleClick = (ev: any) => {
    const username = ev.features[0].properties.username;
    history.push(`${userRoute}/${username}`, location.state);
  };

  const initializeMap = (map: MapboxMap) => {
    map.on("load", () => {
      addCommunitiesToMap(map);
      addPagesToMap(map);
      addClusteredUsersToMap(map, handleClick);
    });
  };

  return (
    <>
      <PageTitle>MapPage</PageTitle>
      <Map
        initialZoom={1}
        initialCenter={new LngLat(0, 0)}
        grow
        postMapInitialize={initializeMap}
        className={classes.root}
      />
    </>
  );
}
