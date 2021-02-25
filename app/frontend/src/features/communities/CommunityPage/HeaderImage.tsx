import { Box, makeStyles } from "@material-ui/core";
import classNames from "classnames";
import { LngLat } from "maplibre-gl";
import React from "react";

import Map from "../../../components/Map";
import { Community } from "../../../pb/communities_pb";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100vw",
    height: "8rem",
    position: "relative",
    left: "50%",
    right: "50%",
    marginLeft: "-50vw",
    marginRight: "-50vw",
    backgroundSize: "cover",
    [theme.breakpoints.up("md")]: {
      height: "16rem",
      marginTop: theme.spacing(-2),
    },
  },
}));

export default function HeaderImage({
  community,
  className,
}: {
  community: Community.AsObject;
  className?: string;
}) {
  const classes = useStyles();

  if (community.mainPage?.photoUrl) {
    return (
      <div
        className={classNames(classes.root, className)}
        style={{ backgroundImage: `url(${community.mainPage?.photoUrl})` }}
      />
    );
  }

  //display a map if there's no image
  //if no location, just display a zoomed out map of the world
  const zoom = community.mainPage?.location ? 13 : 1;
  const lngLat = new LngLat(
    community.mainPage?.location?.lng ?? 0,
    community.mainPage?.location?.lat ?? 0
  );
  return (
    <Box className={classNames(classes.root, className)}>
      <Map grow interactive={false} initialCenter={lngLat} initialZoom={zoom} />
    </Box>
  );
}
