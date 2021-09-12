import classNames from "classnames";
import Map from "components/Map";
import { LngLat } from "maplibre-gl";
import { Page } from "proto/pages_pb";
import React from "react";

import PageHeaderImage, { usePageHeaderStyles } from "./PageHeaderImage";

export default function PageHeader({
  page,
  className,
}: {
  page: Page.AsObject;
  className?: string;
}) {
  const classes = usePageHeaderStyles();

  if (page.photoUrl) {
    return <PageHeaderImage imageUrl={page.photoUrl} />;
  }

  //display a map if there's no image
  //if no location, just display a zoomed out map of the world
  const zoom = page.location ? 13 : 1;
  const lngLat = new LngLat(page.location?.lng ?? 0, page.location?.lat ?? 0);

  return (
    <div className={classNames(classes.root, className)}>
      <Map grow interactive={false} initialCenter={lngLat} initialZoom={zoom} />
    </div>
  );
}
