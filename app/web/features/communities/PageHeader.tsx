import { styled } from "@mui/material";
import Map from "components/OldMap";
import { LngLat } from "maplibre-gl";
import { Page } from "proto/pages_pb";
import React from "react";

const StyledWrapper = styled("div")(({ theme }) => ({
  backgroundSize: "cover",
  backgroundPosition: "center",
  height: "8rem",
  width: "100%",
  marginBottom: theme.spacing(1),
  [theme.breakpoints.down("lg")]: {
    //break out of page margins
    left: "50%",
    marginLeft: "-50vw",
    marginRight: "-50vw",
    position: "relative",
    right: "50%",
    width: "100vw",
  },
  [theme.breakpoints.up("md")]: {
    height: "16rem",
    marginTop: theme.spacing(-2),
  },
}));

export default function PageHeader({
  page,
  className,
}: {
  page: Page.AsObject;
  className?: string;
}) {
  if (page.photoUrl) {
    return (
      <StyledWrapper
        className={className}
        style={{ backgroundImage: `url(${page.photoUrl})` }}
      />
    );
  }

  //display a map if there's no image
  //if no location, just display a zoomed out map of the world
  const zoom = page.location ? 13 : 1;
  const lngLat = new LngLat(page.location?.lng ?? 0, page.location?.lat ?? 0);

  return (
    <StyledWrapper className={className}>
      <Map grow interactive={false} initialCenter={lngLat} initialZoom={zoom} />
    </StyledWrapper>
  );
}
