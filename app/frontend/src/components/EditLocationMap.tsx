import {
  BoxProps,
  makeStyles,
  Slider,
  Typography,
  useTheme,
} from "@material-ui/core";
import classNames from "classnames";
import Alert from "components/Alert";
import Map from "components/Map";
import MapSearch from "components/MapSearch";
import TextField from "components/TextField";
import {
  GeoJSONSource,
  LngLat,
  MapMouseEvent,
  MapTouchEvent,
} from "maplibre-gl";
import React, { useRef, useState } from "react";

import { userLocationMaxRadius, userLocationMinRadius } from "../constants";
import { DISPLAY_LOCATION, LOCATION_PUBLICLY_VISIBLE } from "./constants";

const useStyles = makeStyles({
  root: {
    margin: "auto",
    maxWidth: 700,
  },
  map: {
    height: 400,
    position: "relative",
  },
  grow: {
    height: "100%",
    width: "100%",
  },
  displayLocation: {
    width: "100%",
  },
});

export interface ApproximateLocation {
  address: string;
  lat: number;
  lng: number;
  radius: number;
}

export interface EditLocationMapProps extends BoxProps {
  initialLocation?: ApproximateLocation;
  // this function is called on mouse release
  updateLocation: (value: ApproximateLocation) => void;
  grow?: boolean;
  // whether to hide the radius slider
  showRadiusSlider?: boolean;
  // whether we are selecting an exact point (for pages, etc) or approx circle, doesn't maeks ense with radius slider
  exact?: boolean;
}

export default function EditLocationMap({
  initialLocation,
  updateLocation,
  className,
  grow,
  showRadiusSlider,
  exact,
  ...otherProps
}: EditLocationMapProps) {
  const classes = useStyles();
  const theme = useTheme();
  const [error, setError] = useState("");

  const map = useRef<mapboxgl.Map | null>(null);

  // reactive location
  const [location, setLocation] = useState<ApproximateLocation>(
    initialLocation ?? {
      address: "",
      lat: 0,
      lng: 0,
      radius: 250,
    }
  );

  // map is imperative so these don't need to cause re-render
  const centerCoords = useRef<LngLat | null>(
    initialLocation
      ? new LngLat(location.lng, location.lat)
      : new LngLat(35, 10)
  );
  const radius = useRef(location.radius);

  const onCircleMouseDown = (e: MapMouseEvent | MapTouchEvent) => {
    // Prevent the default map drag behavior.
    e.preventDefault();

    map.current!.getCanvas().style.cursor = "grab";

    if (e.type === "touchstart") {
      const handleTouchMove = (e: MapTouchEvent) => onCircleMove(e);
      map.current!.on("touchmove", handleTouchMove);
      map.current!.once("touchend", (e) => onCircleUp(e, handleTouchMove));
    } else {
      const handleMove = (e: MapMouseEvent) => onCircleMove(e);
      map.current!.on("mousemove", handleMove);
      map.current!.once("mouseup", (e) => onCircleUp(e, handleMove));
    }
  };

  const onCircleMove = (e: MapMouseEvent | MapTouchEvent) => {
    centerCoords.current = e.lngLat;
    redrawMap();
  };

  const onCircleUp = (
    e: MapMouseEvent | MapTouchEvent,
    moveHandler: (x: any) => void
  ) => {
    map.current!.off("mousemove", moveHandler);
    map.current!.off("touchmove", moveHandler);
    map.current!.getCanvas().style.cursor = "move";

    centerCoords.current = e.lngLat;
    redrawMap();
    syncCoords();
  };

  const redrawMap = () => {
    if (!exact) {
      (map.current!.getSource("circle") as GeoJSONSource).setData(
        circleGeoJson(centerCoords.current!, radius.current)
      );
    } else {
      (map.current!.getSource("circle") as GeoJSONSource).setData(
        pointGeoJson(centerCoords.current!)
      );
    }
  };

  // syncs imperative coordinates into the reactive location object
  const syncCoords = () => {
    const wrapped = centerCoords.current!.wrap();
    commit((location) => {
      return {
        ...location,
        lat: wrapped.lat,
        lng: wrapped.lng,
      };
    });
  };

  const commit = (update: (s: ApproximateLocation) => ApproximateLocation) => {
    setLocation(update);
    updateLocation(location);
  };

  const initializeMap = (mapRef: mapboxgl.Map) => {
    map.current = mapRef;
    map.current!.once("load", () => {
      if (!exact) {
        map.current!.addSource("circle", {
          data: circleGeoJson(centerCoords.current!, radius.current),
          type: "geojson",
        });

        map.current!.addLayer({
          id: "circle",
          layout: {},
          paint: {
            "fill-color": theme.palette.primary.main,
            "fill-opacity": 0.5,
          },
          source: "circle",
          type: "fill",
        });
      } else {
        map.current!.addSource("circle", {
          data: pointGeoJson(centerCoords.current!),
          type: "geojson",
        });

        map.current!.addLayer({
          id: "circle",
          layout: {},
          paint: {
            "circle-color": theme.palette.primary.main,
            "circle-radius": 8,
            "circle-stroke-color": "#fff",
            "circle-stroke-width": 1,
          },
          source: "circle",
          type: "circle",
        });
      }

      // if no user is specified, ask to get the location from browser
      if (!initialLocation && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          flyToSearch(
            new LngLat(position.coords.longitude, position.coords.latitude)
          );
        });
      }
    });

    const onDblClick = (e: MapMouseEvent & mapboxgl.EventData) => {
      e.preventDefault();
      onCircleUp(e, () => null);
    };
    map.current!.on("dblclick", onDblClick);

    const onCircleTouch = (
      e: MapTouchEvent & {
        features?: mapboxgl.MapboxGeoJSONFeature[] | undefined;
      } & mapboxgl.EventData
    ) => {
      if (e.points.length !== 1) return;
      onCircleMouseDown(e);
    };
    map.current!.on("mousedown", "circle", onCircleMouseDown);
    map.current!.on("touchstart", "circle", onCircleTouch);

    const canvas = map.current!.getCanvas();
    const setCursorMove = () => (canvas.style.cursor = "move");
    const unsetCursor = () => (canvas.style.cursor = "");
    map.current!.on("mouseenter", "circle", setCursorMove);
    map.current!.on("mouseleave", "circle", unsetCursor);
  };

  const flyToSearch = (location: LngLat) => {
    map.current!.flyTo({ center: location, zoom: 13 });
    if (!exact) {
      const randomizedLocation = displaceLngLat(
        location,
        Math.random() * radius.current,
        Math.random() * 2 * Math.PI
      );
      onCircleUp(
        {
          lngLat: randomizedLocation,
        } as MapMouseEvent,
        () => null
      );
    } else {
      onCircleUp(
        {
          lngLat: location,
        } as MapMouseEvent,
        () => null
      );
    }
  };

  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      <div
        className={classNames(
          classes.root,
          { [classes.grow]: grow },
          className
        )}
      >
        <div className={classNames(classes.map)}>
          <Map
            initialZoom={initialLocation ? 13 : 0.5}
            initialCenter={centerCoords.current!}
            postMapInitialize={initializeMap}
            grow
            {...otherProps}
          />
          <MapSearch
            setError={setError}
            setAddress={(_, simplified) =>
              commit((location) => {
                return { ...location, address: simplified };
              })
            }
            setMarker={flyToSearch}
          />
        </div>
        {showRadiusSlider && (
          <>
            <Typography id="location-radius" gutterBottom>
              Location accuracy
            </Typography>
            <Slider
              aria-labelledby="location-radius"
              value={location.radius}
              min={userLocationMinRadius}
              max={userLocationMaxRadius}
              onChange={(_, value) => {
                radius.current = value as number;
                redrawMap();
                commit((location) => {
                  return { ...location, radius: value as number };
                });
              }}
            />
          </>
        )}
        <TextField
          value={location.address}
          onChange={(e) =>
            commit((location) => {
              return { ...location, address: e.target.value };
            })
          }
          id="display-address"
          fullWidth
          variant="standard"
          label={DISPLAY_LOCATION}
          helperText={LOCATION_PUBLICLY_VISIBLE}
        />
      </div>
    </>
  );
}

function pointGeoJson(
  coords: LngLat
): GeoJSON.FeatureCollection<GeoJSON.Geometry> {
  return {
    features: [
      {
        geometry: {
          coordinates: coords.toArray(),
          type: "Point",
        },
        properties: {},
        type: "Feature",
      },
    ],
    type: "FeatureCollection",
  };
}

function circleGeoJson(
  coords: LngLat,
  radius: number
): GeoJSON.FeatureCollection<GeoJSON.Geometry> {
  return {
    features: [
      {
        geometry: {
          //create a circle of 60 points
          coordinates: [
            [
              ...Array(60)
                .fill(0)
                .map((_, index) => {
                  return displaceLngLat(
                    coords,
                    radius,
                    (index * 2 * Math.PI) / 60
                  ).toArray();
                }),
              displaceLngLat(coords, radius, 0).toArray(),
            ],
          ],
          type: "Polygon",
        },
        properties: {},
        type: "Feature",
      },
    ],
    type: "FeatureCollection",
  };
}

function displaceLngLat(coords: LngLat, distance: number, angle: number) {
  // see https://gis.stackexchange.com/a/2964
  // 111111 m ~ 1 degree
  let lat = coords.lat + (1 / 111111) * distance * Math.cos(angle);
  let lng =
    coords.lng +
    (1 / (111111 * Math.cos((coords.lat / 360) * 2 * Math.PI))) *
      distance *
      Math.sin(angle);

  return new LngLat(lng, lat);
}
