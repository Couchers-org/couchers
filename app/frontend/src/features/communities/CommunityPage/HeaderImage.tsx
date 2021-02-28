import { Box, makeStyles } from "@material-ui/core";
import { LngLat } from "maplibre-gl";
import React from "react";

import Map from "../../../components/Map";
import { Community } from "../../../pb/communities_pb";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100vw",
    height: "8rem",
    [theme.breakpoints.down("sm")]: {
      position: "relative",
      left: "50%",
      right: "50%",
      marginLeft: "-50vw",
      marginRight: "-50vw",
    },
    [theme.breakpoints.up("md")]: {
      width: "100%",
      height: "16rem",
    },
  },
}));

export default function HeaderImage({
  community,
}: {
  community: Community.AsObject;
}) {
  const classes = useStyles();

  //if no location, just display a zoomed out map of the world
  const zoom = community.mainPage?.location ? 13 : 2;
  const lngLat = new LngLat(
    community.mainPage?.location?.lng ?? 0,
    community.mainPage?.location?.lat ?? 0
  );
  return (
    <Box className={classes.root}>
      <Map grow interactive={false} initialCenter={lngLat} initialZoom={zoom} />
    </Box>
  );
}
