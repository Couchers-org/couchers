import {
  debounce,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Radio,
  RadioGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@material-ui/core";
import classNames from "classnames";
import Button from "components/Button";
import { CrossIcon } from "components/Icons";
import TextField from "components/TextField";
import FilterDialog from "features/search/FilterDialog";
import LocationAutocomplete from "features/search/LocationAutocomplete";
import useSearchFilters from "features/search/useSearchFilters";
import { LngLat } from "maplibre-gl";
import { searchQueryKey } from "queryKeys";
import { ChangeEvent, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { GeocodeResult } from "utils/hooks";
import makeStyles from "utils/makeStyles";

import {
  CLEAR_SEARCH,
  FILTER_DIALOG_TITLE,
  LOCATION,
  PROFILE_KEYWORDS,
  SEARCH_BY_KEYWORD,
  SEARCH_BY_LOCATION,
} from "./constants";

const useStyles = makeStyles((theme) => ({
  filterDialogButton: {
    marginInlineStart: "auto",
  },
  mobileHide: {
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  flexRow: {
    display: "flex",
    width: "100%",
  },
}));

export default function SearchBox({
  className,
  searchFilters,
}: {
  className?: string;
  searchFilters: ReturnType<typeof useSearchFilters>;
}) {
  const classes = useStyles();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchType, setSearchType] = useState<"location" | "keyword">(() =>
    searchFilters.active.query && !searchFilters.active.location
      ? "keyword"
      : "location"
  );
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();

  //we will useForm but all will be controlled because
  //of shared state with FilterDialog
  const { control, setValue, errors } = useForm({ mode: "onChange" });

  const handleNewLocation = (value: "" | GeocodeResult) => {
    searchFilters.remove("query");
    setValue("query", "");
    if (value === "") {
      //this is true when clear button is pressed
      //need to clear everything to avoid filters being set without location
      searchFilters.clear();
    } else {
      searchFilters.change("location", value.simplifiedName);
      searchFilters.change("lat", value.location.lat);
      searchFilters.change("lng", value.location.lng);
    }
    //necessary because we don't want to cache every search for each filter
    //but we do want react-query to handle pagination
    queryClient.removeQueries(searchQueryKey());
    searchFilters.apply();
  };

  const handleKeywordsChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | ""
  ) => {
    searchFilters.remove("location");
    searchFilters.remove("lat");
    searchFilters.remove("lng");
    setValue("location", "");
    if (event === "") {
      searchFilters.remove("query");
    } else {
      if (event.target.value === "") {
        searchFilters.remove("query");
      } else {
        searchFilters.change("query", event.target.value);
      }
    }
    //necessary because we don't want to cache every search for each filter
    //but we do want react-query to handle pagination
    queryClient.removeQueries(searchQueryKey());
    searchFilters.apply();
  };
  const handleKeywordsChangeDebounced = debounce(handleKeywordsChange, 500);

  //in case the filters were changed in the dialog, update here
  useEffect(() => {
    setValue("location", searchFilters.active.location ?? "");
    setValue("query", searchFilters.active.query ?? "");
  }, [setValue, searchFilters.active.location, searchFilters.active.query]);

  const filterDialogButton = (
    <>
      <Button
        onClick={() => setIsFiltersOpen(true)}
        className={classNames(className, classes.filterDialogButton)}
        variant={isSmDown ? "contained" : "outlined"}
        size="small"
      >
        {FILTER_DIALOG_TITLE}
      </Button>
      <FilterDialog
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        searchFilters={searchFilters}
      />
    </>
  );
  if (isSmDown) {
    return filterDialogButton;
  }

  return (
    <>
      {searchType === "location" ? (
        <LocationAutocomplete
          control={control}
          name="location"
          defaultValue={
            searchFilters.active.location
              ? {
                  name: searchFilters.active.location,
                  simplifiedName: searchFilters.active.location,
                  location: new LngLat(
                    searchFilters.active.lng ?? 0,
                    searchFilters.active.lat ?? 0
                  ),
                }
              : ""
          }
          label={LOCATION}
          onChange={handleNewLocation}
          fieldError={errors.location?.message}
          disableRegions
        />
      ) : (
        <Controller
          control={control}
          name="query"
          defaultValue={searchFilters.active.query ?? ""}
          render={({ value, onChange }) => (
            <TextField
              fullWidth
              id="query"
              value={value}
              label={PROFILE_KEYWORDS}
              variant="standard"
              helperText=" "
              onChange={(event) => {
                onChange(event.target.value);
                handleKeywordsChangeDebounced(event);
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={CLEAR_SEARCH}
                      onClick={() => {
                        setValue("query", "");
                        handleKeywordsChange("");
                      }}
                      size="small"
                    >
                      <CrossIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}
        />
      )}
      <div className={classes.flexRow}>
        <FormControl component="fieldset">
          <RadioGroup
            row
            onChange={(e, value) =>
              setSearchType(value as "location" | "keyword")
            }
            value={searchType}
          >
            <FormControlLabel
              value="location"
              control={<Radio />}
              label={
                <Typography variant="body2">{SEARCH_BY_LOCATION}</Typography>
              }
            />
            <FormControlLabel
              value="keyword"
              control={<Radio />}
              label={
                <Typography variant="body2">{SEARCH_BY_KEYWORD}</Typography>
              }
            />
          </RadioGroup>
        </FormControl>
        {filterDialogButton}
      </div>
    </>
  );
}
