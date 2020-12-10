import { BoxProps, makeStyles, useTheme } from "@material-ui/core";
import Map from "./Map";
import { GeoJSONSource, LngLat, MapMouseEvent } from "mapbox-gl";
import React, { useRef, useState } from "react";
import { User } from "../pb/api_pb";
import Alert from "./Alert";
import { AutocompleteChangeReason } from "@material-ui/lab";

const nominatimURL = process.env.REACT_APP_NOMINATIM_URL;

const useStyles = makeStyles((theme) => ({
  circle: {
    fillOpacity: 0.3,
    fill: theme.palette.primary.main,
    strokeWidth: 1,
    stroke: "white",
  },
  handle: {
    fill: theme.palette.primary.main,
    strokeWidth: 2,
    stroke: "white",
  },
}));

export interface ApproximateLocation {
  location: LngLat;
  //meters
  radius: number;
}

interface SearchOption {
  name: string;
  lat: number;
  lng: number;
}

export interface EditUserLocationMapProps extends BoxProps {
  user: User.AsObject;
  //this function is called on mouse release
  setLocation: (value: ApproximateLocation) => void;
  //this function is called on every change
  setCity: (value: string) => void;
}

export default function EditUserLocationMap({
  user,
  setCity,
  setLocation,
  ...otherProps
}: EditUserLocationMapProps) {
  const classes = useStyles();
  const theme = useTheme();

  const [searchOptionsLoading, setSearchOptionsLoading] = useState(false);
  const [searchOptions, setSearchOptions] = useState<SearchOption[]>([]);
  const [error, setError] = useState("");

  //map is imperative so these don't need to cause re-render
  const dirtyCoords = useRef<LngLat | null>(new LngLat(user.lng, user.lat));
  const dirtyRadius = useRef<number | null>(user.radius);
  const handleCoords = useRef<LngLat | null>(
    displaceLngLat(dirtyCoords.current!, user.radius, 0)
  );

  const loadSearchOptions = async (value: string) => {
    setError("");
    if (!value) {
      setSearchOptions([]);
      return;
    }
    setSearchOptionsLoading(true);
    const url =
      nominatimURL! + "search?format=jsonv2&q=" + encodeURIComponent(value);
    const options = {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json;charset=UTF-8",
      },
    };
    try {
      const res = await fetch(url, options);
      const data = (await res.json()) as Array<any>;
      setSearchOptions(
        data.map((obj) => ({
          name: obj["display_name"],
          lat: Number(obj["lat"]),
          lng: Number(obj["lon"]),
        }))
      );
    } catch (e) {
      //setError(e.message);
      setSearchOptions([{ name: "lond", lng: 0, lat: 51.4 }]);
    }
    setSearchOptionsLoading(false);
  };

  const flyTo = (value: SearchOption) => {
    /*if (!(value as SearchOption).name) return;
    if (!mapRef) return;
    const searchOption = value as SearchOption;
    mapRef.current?.getMap().flyTo({
      center: { lat: searchOption.lat, lng: searchOption.lng },
      zoom: 13,
    });*/
  };

  const searchSubmit = (
    value: string | SearchOption | null,
    reason: AutocompleteChangeReason
  ) => {
    if (!(value as SearchOption).name) {
      setCity(value as string);
      if (reason !== "blur") {
        loadSearchOptions(value as string);
      }
    }
    const searchOption = value as SearchOption;
    flyTo(searchOption);
  };

  const onCircleMove = (lngLat: LngLat, map: mapboxgl.Map) => {
    const lat1 = (dirtyCoords.current!.lat / 360) * 2 * Math.PI;
    const lng1 = (dirtyCoords.current!.lng / 360) * 2 * Math.PI;
    const lat2 = (handleCoords.current!.lat / 360) * 2 * Math.PI;
    const lng2 = (handleCoords.current!.lng / 360) * 2 * Math.PI;
    const lngDiff = lng2 - lng1;
    const bearing = Math.atan2(
      Math.sin(lngDiff) * Math.cos(lat2),
      Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(lngDiff)
    );

    dirtyCoords.current = lngLat;
    handleCoords.current = displaceLngLat(
      lngLat,
      dirtyRadius.current!,
      bearing
    );
    (map.getSource("circle") as GeoJSONSource).setData(
      circleGeoJson(dirtyCoords.current!, dirtyRadius.current!)
    );
    (map.getSource("handle") as GeoJSONSource).setData(
      pointGeoJson(handleCoords.current!)
    );
  };

  const onCircleUp = (
    lngLat: LngLat,
    map: mapboxgl.Map,
    moveEvent: (x: any) => void
  ) => {
    onCircleMove(lngLat, map);
    setLocation({
      location: dirtyCoords.current!,
      radius: dirtyRadius.current!,
    });

    map.off("mousemove", moveEvent);
    map.off("touchmove", moveEvent);
  };
  const onHandleMove = (lngLat: LngLat, map: mapboxgl.Map) => {
    dirtyRadius.current = dirtyCoords.current!.distanceTo(lngLat);
    handleCoords.current = lngLat;
    (map.getSource("circle") as GeoJSONSource).setData(
      circleGeoJson(dirtyCoords.current!, dirtyRadius.current!)
    );
    (map.getSource("handle") as GeoJSONSource).setData(
      pointGeoJson(handleCoords.current!)
    );
  };

  const onHandleUp = (
    lngLat: LngLat,
    map: mapboxgl.Map,
    moveEvent: (x: any) => void
  ) => {
    onHandleMove(lngLat, map);
    setLocation({
      location: dirtyCoords.current!,
      radius: dirtyRadius.current!,
    });

    map.off("mousemove", moveEvent);
    map.off("touchmove", moveEvent);
  };

  const initializeMap = (map: mapboxgl.Map) => {
    const canvas = map.getCanvas();
    map.on("load", () => {
      map.addSource("circle", {
        type: "geojson",
        data: circleGeoJson(dirtyCoords.current!, dirtyRadius.current!),
      });
      map.addSource("handle", {
        type: "geojson",
        data: pointGeoJson(
          displaceLngLat(dirtyCoords.current!, dirtyRadius.current!, 0)
        ),
      });

      map.addLayer({
        id: "circle",
        type: "fill",
        source: "circle",
        layout: {},
        paint: {
          "fill-color": theme.palette.primary.main,
          "fill-opacity": 0.5,
        },
      });
      map.addLayer({
        id: "handle",
        type: "circle",
        source: "handle",
        paint: {
          "circle-radius": 10,
          "circle-color": theme.palette.primary.main,
        },
      });

      map.on("dblclick", (e) => {
        e.preventDefault();
        onHandleMove(e.lngLat, map);
        console.log(e.lngLat);
        map.flyTo({ center: e.lngLat });
      });

      map.on("mousedown", "circle", function (e) {
        //don't continue if the marker received the event already
        if (e.originalEvent.cancelBubble || e.originalEvent.defaultPrevented)
          return;
        // Prevent the default map drag behavior.
        e.preventDefault();

        canvas.style.cursor = "grab";

        const moveEvent = (e: MapMouseEvent) => onCircleMove(e.lngLat, map);
        map.on("mousemove", moveEvent);
        map.once("mouseup", (e) => onCircleUp(e.lngLat, map, moveEvent));
      });

      map.on("touchstart", "circle", function (e) {
        if (e.points.length !== 1) return;
        if (e.originalEvent.cancelBubble || e.originalEvent.defaultPrevented)
          return;

        // Prevent the default map drag behavior.
        e.preventDefault();

        const moveEvent = (e: MapMouseEvent) => onCircleMove(e.lngLat, map);
        map.on("mousemove", moveEvent);
        map.once("touchend", (e) => onCircleUp(e.lngLat, map, moveEvent));
      });
      map.on("mousedown", "handle", function (e) {
        e.originalEvent.cancelBubble = true;
        // Prevent the default map drag behavior.
        e.preventDefault();

        canvas.style.cursor = "grab";

        const moveEvent = (e: MapMouseEvent) => onHandleMove(e.lngLat, map);
        map.on("mousemove", moveEvent);
        map.once("mouseup", (e) => onHandleUp(e.lngLat, map, moveEvent));
      });

      map.on("touchstart", "handle", function (e) {
        if (e.points.length !== 1) return;
        e.originalEvent.cancelBubble = true;

        // Prevent the default map drag behavior.
        e.preventDefault();

        const moveEvent = (e: MapMouseEvent) => onHandleMove(e.lngLat, map);
        map.on("touchmove", moveEvent);
        map.once("touchend", (e) => onHandleUp(e.lngLat, map, moveEvent));
      });
    });
  };

  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      <Map
        initialZoom={13}
        initialCenter={new LngLat(user.lng, user.lat)}
        postMapInitialize={initializeMap}
        {...otherProps}
      />
      {/*<ApproximateLocationMap
        handleSize={20}
        initialZoom={13}
        initialLocation={{
          location: new LngLat(user.lng, user.lat),
          radius: user.radius,
        }}
        setLocation={setLocation}
        mapRef={mapRef}
        {...otherProps}
      >
        <MapSearch
          label="Display location as"
          options={searchOptions}
          loading={searchOptionsLoading}
          getOptionLabel={(option) => option.name}
          onInputChange={(_, value) => setCity(value)}
          onChange={(_, value, reason) => searchSubmit(value, reason)}
        />
      </ApproximateLocationMap>*/}
    </>
  );
}

function pointGeoJson(
  coords: LngLat
): GeoJSON.FeatureCollection<GeoJSON.Geometry> {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: coords.toArray(),
        },
      },
    ],
  };
}

function circleGeoJson(
  coords: LngLat,
  radius: number
): GeoJSON.FeatureCollection<GeoJSON.Geometry> {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
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
        },
      },
    ],
  };
}

function displaceLngLat(coords: LngLat, distance: number, angle: number) {
  // see https://gis.stackexchange.com/a/2964
  // 111111 m ~ 1 degree
  const lat = coords.lat + (1 / 111111) * distance * Math.cos(angle);
  const lng =
    coords.lng +
    (1 / (111111 * Math.cos((coords.lat / 360) * 2 * Math.PI))) *
      distance *
      Math.sin(angle);
  return new LngLat(lng, lat);
}
