import { Box, IconButton } from "@material-ui/core";
import { AutocompleteChangeReason } from "@material-ui/lab/Autocomplete";
import { LngLat } from "maplibre-gl";
import React, { useEffect, useState } from "react";
import { useGeocodeQuery } from "utils/hooks";
import makeStyles from "utils/makeStyles";

import Autocomplete from "./Autocomplete";
import {
  NO_LOCATION_RESULTS_TEXT,
  PRESS_ENTER_TO_SEARCH,
  SEARCH_FOR_LOCATION,
} from "./constants";
import { SearchIcon } from "./Icons";

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

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const { query, isLoading, results, error } = useGeocodeQuery();

  //create a dummy search options if there are no results
  const searchOptions = isLoading
    ? []
    : results && results.length === 0
    ? [
        {
          location: new LngLat(0, 0),
          name: NO_LOCATION_RESULTS_TEXT,
          simplifiedName: "",
        },
      ]
    : results;

  useEffect(() => {
    setError(error || "");
    if (error) setOpen(false);
  }, [error, setError]);

  const searchSubmit = (value: string, reason: AutocompleteChangeReason) => {
    if (reason === "blur") {
      setOpen(false);
      return;
    }
    const searchOption = results?.find((o) => value === o.name);

    if (!searchOption) {
      //create-option is when enter is pressed on user-entered string
      if (reason === "create-option") {
        query(value);
        setOpen(true);
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
          id="map-search"
          label={SEARCH_FOR_LOCATION}
          value={value}
          size="small"
          options={searchOptions?.map((o) => o.name) || []}
          loading={isLoading}
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
          onKeyDown={(e) => {
            if (e.key === "Enter") searchSubmit(value, "create-option");
          }}
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
