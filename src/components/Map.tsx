import "maplibre-gl/dist/maplibre-gl.css";

import { Typography } from "@material-ui/core";
import classNames from "classnames";
import { NO_MAP_SUPPORT } from "components/constants";
import maplibregl, { LngLat, RequestParameters } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import makeStyles from "utils/makeStyles";

const URL = process.env.REACT_APP_API_BASE_URL;

maplibregl.accessToken = process.env.REACT_APP_MAPBOX_KEY!;

const useStyles = makeStyles({
  root: {
    height: 200,
    position: "relative",
    width: 400,
  },
  grow: {
    height: "100%",
    width: "100%",
  },
  map: {
    position: "absolute",
    bottom: 0,
    top: 0,
    width: "100%",
  },
  noMapText: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
});

export interface MapProps {
  initialCenter: LngLat;
  initialZoom: number;
  postMapInitialize?: (map: maplibregl.Map) => void;
  className?: string;
  onUpdate?: (center: LngLat, zoom: number) => void;
  grow?: boolean;
  interactive?: boolean;
  hash?: boolean;
}

export default function Map({
  initialCenter,
  initialZoom,
  grow,
  postMapInitialize,
  onUpdate,
  hash,
  interactive = true,
  className,
  ...otherProps
}: MapProps) {
  const classes = useStyles();

  const containerRef = useRef<HTMLDivElement>(null);
  const [noMap, setNoMap] = useState(false);

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

  const mapRef = useRef<maplibregl.Map>();
  useEffect(() => {
    if (!containerRef.current) return;
    //don't create a new map if it exists already
    if (mapRef.current) return;
    try {
      const map = new maplibregl.Map({
        center: initialCenter,
        container: containerRef.current,
        hash: hash ? "loc" : false,
        interactive: interactive,
        style: "mapbox://styles/mapbox/light-v10",
        transformRequest,
        zoom: initialZoom,
      });
      mapRef.current = map;

      if (interactive)
        map.addControl(
          new maplibregl.NavigationControl({ showCompass: false })
        );

      if (onUpdate) {
        map.on("moveend", () => onUpdate(map.getCenter(), map.getZoom()));
      }

      postMapInitialize?.(map);
    } catch {
      //probably no webgl
      console.warn("Couldn't initialize maplibre gl");
      setNoMap(true);
    }
  }, [
    initialCenter,
    initialZoom,
    interactive,
    onUpdate,
    postMapInitialize,
    hash,
  ]);

  useEffect(() => () => mapRef?.current?.remove(), []);

  return (
    <div
      className={classNames(classes.root, { [classes.grow]: grow }, className)}
      {...otherProps}
    >
      <div className={classes.map} ref={containerRef}>
        {noMap && (
          <div className={classes.noMapText}>
            <Typography variant="body1">{NO_MAP_SUPPORT}</Typography>
          </div>
        )}
      </div>
    </div>
  );
}
