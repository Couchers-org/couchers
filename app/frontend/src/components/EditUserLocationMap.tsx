import { BoxProps, debounce, makeStyles } from "@material-ui/core";
import { LngLat } from "mapbox-gl";
import React, { useCallback, useRef, useState } from "react";
import { User } from "../pb/api_pb";
import Alert from "./Alert";
import ApproximateLocationMap from "./ApproximateLocationMap";
import MapSearch from "./MapSearch";
import ReactMapGL from "react-map-gl";
import {
  AutocompleteChangeDetails,
  AutocompleteChangeReason,
} from "@material-ui/lab";

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

  const [searchOptionsLoading, setSearchOptionsLoading] = useState(false);
  const [searchOptions, setSearchOptions] = useState<SearchOption[]>([]);
  const [error, setError] = useState("");

  const mapRef = useRef<ReactMapGL>(null);

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
    if (!(value as SearchOption).name) return;
    if (!mapRef) return;
    const searchOption = value as SearchOption;
    mapRef.current?.getMap().flyTo({
      center: { lat: searchOption.lat, lng: searchOption.lng },
      zoom: 13,
    });
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

  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      <ApproximateLocationMap
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
      </ApproximateLocationMap>
    </>
  );
}
