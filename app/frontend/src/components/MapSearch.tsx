import { Box, IconButton } from "@material-ui/core";
import { AutocompleteChangeReason } from "@material-ui/lab/Autocomplete";
import { LngLat } from "maplibre-gl";
import React, { useState } from "react";
import makeStyles from "utils/makeStyles";

import { NominatimPlace, simplifyPlaceDisplayName } from "../utils/nominatim";
import Autocomplete from "./Autocomplete";
import {
  NO_LOCATION_RESULTS_TEXT,
  PRESS_ENTER_TO_SEARCH,
  SEARCH_FOR_LOCATION,
} from "./constants";
import { SearchIcon } from "./Icons";

const NOMINATIM_URL = process.env.REACT_APP_NOMINATIM_URL;

const useSearchStyles = makeStyles((theme) => ({
  autocomplete: {
    flexGrow: 1,
  },
  form: {
    display: "flex",
    alignItems: "center",
    width: "100%",
  },
  root: {
    "& *": {
      opacity: 1,
    },
    "& .MuiAutocomplete-input": {
      fontSize: "0.75rem",
    },
    "& .MuiFormHelperText-root": {
      fontSize: "0.65rem",
    },
    "& .MuiInputLabel-root": {
      fontSize: "0.75rem",
    },
    background: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius * 3,
    left: 10,
    opacity: 0.9,
    padding: theme.spacing(1),
    position: "absolute",
    top: 10,
    width: "70%",
    zIndex: 1,
  },
}));

interface SearchOption {
  name: string;
  simplifiedName: string;
  location: LngLat;
}

interface MapSearchProps {
  setError: (error: string) => void;
  setResult: (
    lngLat: LngLat,
    address: string,
    simplifiedAddress: string
  ) => void;
}

export default function MapSearch({ setError, setResult }: MapSearchProps) {
  const classes = useSearchStyles();

  const [searchOptionsLoading, setSearchOptionsLoading] = useState(false);
  const [searchOptions, setSearchOptions] = useState<SearchOption[]>([]);
  const [open, setOpen] = useState(false);

  const [value, setValue] = useState("");

  const loadSearchOptions = async (value: string) => {
    setError("");
    setOpen(true);
    setSearchOptions([]);
    if (!value) {
      return;
    }
    setSearchOptionsLoading(true);
    const url = `${NOMINATIM_URL!}search?format=jsonv2&q=${encodeURIComponent(
      value
    )}&addressdetails=1`;
    const options = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json;charset=UTF-8",
      },
      method: "GET",
    };
    try {
      const response = await fetch(url, options);
      const nominatimResults = (await response.json()) as Array<NominatimPlace>;

      if (nominatimResults.length === 0) {
        setSearchOptions([
          {
            location: new LngLat(0, 0),
            name: NO_LOCATION_RESULTS_TEXT,
            simplifiedName: "",
          },
        ]);
      } else {
        setSearchOptions(
          nominatimResults.map((result) => {
            return {
              location: new LngLat(
                Number(result["lon"]),
                Number(result["lat"])
              ),
              name: result["display_name"],
              simplifiedName: simplifyPlaceDisplayName(result),
            };
          })
        );
      }
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
      //create-option is when enter is pressed on user-entered string
      if (reason === "create-option") {
        loadSearchOptions(value);
      }
    } else {
      setResult(
        searchOption.location,
        searchOption.name,
        searchOption.simplifiedName
      );
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
          label={SEARCH_FOR_LOCATION}
          value={value}
          size="small"
          options={searchOptions.map((o) => o.name)}
          loading={searchOptionsLoading}
          open={open}
          onBlur={() => setOpen(false)}
          onInputChange={(e, v) => setValue(v)}
          onChange={(e, v, reason) => {
            setValue(v);
            searchSubmit(v, reason);
          }}
          freeSolo
          multiple={false}
          // show all returned results, don't do a filter client side
          filterOptions={(x) => x}
          disableClearable
          className={classes.autocomplete}
          getOptionDisabled={(option) => option === NO_LOCATION_RESULTS_TEXT}
          helperText={PRESS_ENTER_TO_SEARCH}
        />
        <IconButton
          aria-label="Search location"
          size="medium"
          onClick={() => {
            searchSubmit(value, "create-option");
          }}
        >
          <SearchIcon />
        </IconButton>
      </form>
    </Box>
  );
}
