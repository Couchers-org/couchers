import { makeStyles } from "@material-ui/core";
import { AutocompleteChangeReason } from "@material-ui/lab";
import { LngLat } from "mapbox-gl";
import React, { useState } from "react";
import Autocomplete from "./Autocomplete";

const nominatimURL = process.env.REACT_APP_NOMINATIM_URL;

const useSearchStyles = makeStyles((theme) => ({
  root: {
    position: "absolute",
    left: 10,
    top: 10,
    width: "70%",
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    zIndex: 1,
    background: theme.palette.background.default,
    opacity: 0.9,
    "& *": {
      opacity: 1,
    },
    "& .MuiAutocomplete-input": {
      fontSize: "0.75rem",
    },
    "& .MuiInputLabel-root": {
      fontSize: "0.75rem",
    },
    "& .MuiFormHelperText-root": {
      fontSize: "0.65rem",
    },
  },
}));

interface SearchOption {
  name: string;
  location: LngLat;
}

interface MapSearchProps {
  setCity: (value: string) => void;
  setError: (error: string) => void;
  setMarker: (lngLat: LngLat) => void;
}

export default function MapSearch({
  setCity,
  setError,
  setMarker,
}: MapSearchProps) {
  const classes = useSearchStyles();

  const [searchOptionsLoading, setSearchOptionsLoading] = useState(false);
  const [searchOptions, setSearchOptions] = useState<SearchOption[]>([]);
  const [open, setOpen] = useState(false);

  const loadSearchOptions = async (value: string) => {
    setError("");
    setOpen(true);
    setSearchOptions([]);
    if (!value) {
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
      console.log(data);
      setSearchOptions(
        data.map((obj) => ({
          name: obj["display_name"],
          location: new LngLat(Number(obj["lon"]), Number(obj["lat"])),
        }))
      );
    } catch (e) {
      setError(e.message);
      setOpen(false);
    }
    setSearchOptionsLoading(false);
  };

  const searchSubmit = (
    value: string | SearchOption | null,
    reason: AutocompleteChangeReason
  ) => {
    console.log(reason);
    if (reason === "blur") {
      setOpen(false);
      return;
    }
    if (!(value as SearchOption)?.name) {
      setCity(value as string);
      //create-option is when enter is pressed on user-entered string
      if (reason === "create-option") {
        loadSearchOptions(value as string);
      }
    } else {
      const searchOption = value as SearchOption;
      setMarker(searchOption.location);
      setOpen(false);
    }
  };

  return (
    <Autocomplete
      label="My location"
      //hint="Press enter to search the map, then customize the text."
      size="small"
      options={searchOptions}
      getOptionLabel={(o) => (!!o.name ? o.name : String(o))}
      loading={searchOptionsLoading}
      open={open}
      onBlur={() => setOpen(false)}
      onChange={(_, value, reason) => searchSubmit(value, reason)}
      onInputChange={(_, value) => setCity(value)}
      freeSolo
      multiple={false}
      disableClearable={false}
      className={classes.root}
    />
  );
}
