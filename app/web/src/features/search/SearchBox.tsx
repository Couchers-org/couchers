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
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { register } from "serviceWorker";
import { GeocodeResult } from "utils/hooks";
import makeStyles from "utils/makeStyles";

import {
  CLEAR_SEARCH,
  FILTER_DIALOG_TITLE,
  lastActiveOptions,
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
  const [searchType, setSearchType] = useState<"location" | "keyword">(
    "location"
  );
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));

  //we will useForm but all will be controlled because
  //of shared state with FilterDialog
  const { control, setValue } = useForm();
  //prevent defaultValue changing
  const defaultValues = useRef({
    location:
      searchFilters.active.location &&
      searchFilters.active.lng &&
      searchFilters.active.lat
        ? {
            name: searchFilters.active.location,
            simplifiedName: searchFilters.active.location,
            location: new LngLat(
              searchFilters.active.lng,
              searchFilters.active.lat
            ),
          }
        : undefined,
    keywords: searchFilters.active.query,
    lastActive: lastActiveOptions.find(
      (o) => o.value === searchFilters.active.lastActive
    ),
    hostingStatusOptions: searchFilters.active.hostingStatusOptions,
    numGuests: searchFilters.active.numGuests,
  }).current;

  const handleNewLocation = (value: "" | GeocodeResult) => {
    searchFilters.remove("query");
    setValue("query", "");
    if (value === "") {
      searchFilters.remove("location");
      searchFilters.remove("lat");
      searchFilters.remove("lng");
    } else {
      searchFilters.change("location", value.simplifiedName);
      searchFilters.change("lat", value.location.lat);
      searchFilters.change("lng", value.location.lng);
    }
    searchFilters.apply();
  };

  const handleKeywordsChange = debounce(
    (event: ChangeEvent<HTMLInputElement>) => {
      searchFilters.remove("location");
      searchFilters.remove("lat");
      searchFilters.remove("lng");
      setValue("location", "");
      if (event.target.value === "") {
        searchFilters.remove("query");
      } else {
        searchFilters.change("query", event.target.value);
      }
      searchFilters.apply();
    },
    500
  );

  //in case the filters were changed in the dialog, update here
  useEffect(() => {
    setValue("location", searchFilters.active.location);
    setValue("query", searchFilters.active.query);
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
          defaultValue={defaultValues.location}
          label={LOCATION}
          onChange={handleNewLocation}
        />
      ) : (
        <TextField
          fullWidth
          defaultValue={defaultValues.keywords}
          id="keywords-search"
          label={PROFILE_KEYWORDS}
          name="query"
          inputRef={register}
          variant="standard"
          helperText=" "
          onChange={handleKeywordsChange}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={CLEAR_SEARCH}
                  onClick={() => {
                    setValue("query", "");
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
