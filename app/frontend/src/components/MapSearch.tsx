import { Box, IconButton, makeStyles } from "@material-ui/core";
import { AutocompleteChangeReason } from "@material-ui/lab/Autocomplete";
import { LngLat } from "mapbox-gl";
import React, { useState } from "react";

import Autocomplete from "./Autocomplete";
import { SearchIcon } from "./Icons";

const NOMINATIM_URL = process.env.REACT_APP_NOMINATIM_URL;

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
  form: { width: "100%", display: "flex" },
  autocomplete: { flexGrow: 1 },
}));

interface SearchOption {
  name: string;
  location: LngLat;
}

interface MapSearchProps {
  value: string;
  setValue: (value: string) => void;
  setError: (error: string) => void;
  setMarker: (lngLat: LngLat) => void;
}

export default function MapSearch({
  value,
  setValue,
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
      NOMINATIM_URL! + "search?format=jsonv2&q=" + encodeURIComponent(value);
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
          location: new LngLat(Number(obj["lon"]), Number(obj["lat"])),
        }))
      );
    } catch (e) {
      setError(e.message);
      setOpen(false);
    }
    setSearchOptionsLoading(false);
  };

  const searchSubmit = (value: string, reason: AutocompleteChangeReason) => {
    if (reason === "blur") {
      setOpen(false);
      return;
    }
    const searchOption = searchOptions.find((o) => value === o.name);
    if (!searchOption) {
      setValue(value);
      //create-option is when enter is pressed on user-entered string
      if (reason === "create-option") {
        loadSearchOptions(value);
      }
    } else {
      setMarker(searchOption.location);
      setOpen(false);
    }
  };

  return (
    <Box className={classes.root}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          searchSubmit(value, "create-option");
        }}
        className={classes.form}
      >
        <Autocomplete
          label="My location"
          value={value}
          size="small"
          options={searchOptions.map((o) => o.name)}
          loading={searchOptionsLoading}
          open={open}
          onBlur={() => setOpen(false)}
          onChange={(e, inputValue, reason) => {
            setValue(inputValue ?? "");
            searchSubmit(inputValue ?? "", reason);
          }}
          onInputChange={(_, inputValue) => setValue(inputValue)}
          freeSolo
          multiple={false}
          disableClearable={false}
          className={classes.autocomplete}
        />
        <IconButton
          aria-label="Search location"
          size="small"
          onClick={() => {
            setValue(value);
            searchSubmit(value, "create-option");
          }}
        >
          <SearchIcon />
        </IconButton>
      </form>
    </Box>
  );
}
