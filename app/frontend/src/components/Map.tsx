import "maplibre-gl/dist/mapbox-gl.css";

import { makeStyles } from "@material-ui/core";
import classNames from "classnames";
import mapboxgl, { LngLat, RequestParameters } from "maplibre-gl";
import { useEffect, useRef } from "react";

const URL = process.env.REACT_APP_API_BASE_URL;

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY!;

const useStyles = makeStyles({
  grow: {
    "div&": {
      height: "100%",
      width: "100%",
    },
  },
  map: {
    height: "100%",
    left: 0,
    position: "absolute",
    top: 0,
    width: "100%",
  },
  root: {
    height: 200,
    position: "relative",
    width: 400,
  },
});

export interface MapProps {
  initialCenter: LngLat;
  initialZoom: number;
  postMapInitialize?: (map: mapboxgl.Map) => void;
  className?: string;
  onUpdate?: (center: LngLat, zoom: number) => void;
  grow?: boolean;
  interactive?: boolean;
}

export default function Map({
  initialCenter,
  initialZoom,
  grow,
  postMapInitialize,
  onUpdate,
  interactive = true,
  className,
  ...otherProps
}: MapProps) {
  const classes = useStyles();

  const containerRef = useRef<HTMLDivElement>(null);

  /*
  Allows sending cookies (counted as sensitive "credentials") on cross-origin requests when we grab GeoJSON/other data from the API.

  Those APIs will return an error if the session cookie is not set as these APIs are secure and not public.
  */
  const transformRequest = (url: string): RequestParameters => {
    if (url.startsWith(URL)) {
      return {
        credentials: "include",
        url,
      };
    }
    return { url };
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new mapboxgl.Map({
      center: initialCenter,
      container: containerRef.current,
      hash: "loc",
      interactive: interactive,
      style: "mapbox://styles/mapbox/streets-v11",
      transformRequest,
      zoom: initialZoom,
    });

    if (interactive)
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));

    if (onUpdate) {
      map.on("moveend", () => onUpdate(map.getCenter(), map.getZoom()));
    }

    if (postMapInitialize) postMapInitialize(map);
  }, [initialCenter, initialZoom, interactive, onUpdate, postMapInitialize]);

  return (
    <div
      className={classNames(classes.root, { [classes.grow]: grow }, className)}
      {...otherProps}
    >
      <div className={classes.map} ref={containerRef} />
    </div>
  );
}
