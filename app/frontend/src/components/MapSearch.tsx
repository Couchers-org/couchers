import { Box, IconButton, makeStyles } from "@material-ui/core";
import { AutocompleteChangeReason } from "@material-ui/lab/Autocomplete";
import { LngLat } from "maplibre-gl";
import React, { useState } from "react";

import { NominatimPlace, simplifyPlaceDisplayName } from "../utils/nominatim";
import Autocomplete from "./Autocomplete";
import { SearchIcon } from "./Icons";

const NOMINATIM_URL = process.env.REACT_APP_NOMINATIM_URL;

const NO_RESULTS_TEXT = "No results. Try searching for just the city.";

const useSearchStyles = makeStyles((theme) => ({
  autocomplete: {
    flexGrow: 1,
  },
  form: {
    display: "flex",
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
    borderRadius: theme.shape.borderRadius,
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
  setAddress: (address: string, simplifiedAddress: string) => void;
  setError: (error: string) => void;
  setMarker: (lngLat: LngLat) => void;
}

export default function MapSearch({
  setAddress,
  setError,
  setMarker,
}: MapSearchProps) {
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

      console.log(nominatimResults);

      if (nominatimResults.length === 0) {
        console.log("populating with empty place");
        setSearchOptions([
          {
            location: new LngLat(0, 0),
            name: NO_RESULTS_TEXT,
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
      // setAddress(value, value);
      //create-option is when enter is pressed on user-entered string
      if (reason === "create-option") {
        loadSearchOptions(value);
      }
    } else {
      setMarker(searchOption.location);
      setAddress(searchOption.name, searchOption.simplifiedName);
      setOpen(false);
    }
  };

  // <Box>
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
          label="Search for location"
          value={value}
          size="small"
          options={searchOptions.map((o) => o.name)}
          loading={searchOptionsLoading}
          open={open}
          onBlur={() => setOpen(false)}
          onChange={(e, inputValue, reason) => {
            // setAddress(inputValue ?? "", inputValue ?? "");
            setValue(inputValue ?? "");
            searchSubmit(inputValue ?? "", reason);
          }}
          // onInputChange={(_, inputValue) => setAddress(inputValue, inputValue)}
          freeSolo
          multiple={false}
          // show all returned results, don't do a filter client side
          filterOptions={(x) => x}
          disableClearable={false}
          className={classes.autocomplete}
          getOptionDisabled={(option) => option === NO_RESULTS_TEXT}
          helperText="Press enter to search"
        />
        <IconButton
          aria-label="Search location"
          size="small"
          onClick={() => {
            // setAddress(value, value);
            searchSubmit(value, "create-option");
          }}
        >
          <SearchIcon />
        </IconButton>
      </form>
    </Box>
  );
}
