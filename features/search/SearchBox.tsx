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
import LocationAutocomplete from "components/LocationAutocomplete";
import TextField from "components/TextField";
import { searchQueryKey } from "features/queryKeys";
import FilterDialog from "features/search/FilterDialog";
import useRouteWithSearchFilters from "features/search/useRouteWithSearchFilters";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { LngLat } from "maplibre-gl";
import { ChangeEvent, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { GeocodeResult } from "utils/hooks";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  filterDialogButtonDesktop: {
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
  searchFilters: ReturnType<typeof useRouteWithSearchFilters>;
}) {
  const { t } = useTranslation([GLOBAL, SEARCH]);
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

  const filterDialog = (
    <FilterDialog
      isOpen={isFiltersOpen}
      onClose={() => setIsFiltersOpen(false)}
      searchFilters={searchFilters}
    />
  );

  if (isSmDown) {
    return (
      <>
        <Button
          onClick={() => setIsFiltersOpen(true)}
          className={className}
          variant="contained"
          size="medium"
        >
          {t("search:filter_dialog.mobile_title")}
        </Button>

        {filterDialog}
      </>
    );
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
          label={t("search:form.location_field_label")}
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
              label={t("search:form.keywords.field_label")}
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
                      aria-label={t(
                        "search:form.keywords.clear_field_action_a11y_label"
                      )}
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
                <Typography variant="body2">
                  {t("search:form.by_location_filter_label")}
                </Typography>
              }
            />
            <FormControlLabel
              value="keyword"
              control={<Radio />}
              label={
                <Typography variant="body2">
                  {t("search:form.by_keyword_filter_label")}
                </Typography>
              }
            />
          </RadioGroup>
        </FormControl>

        <Button
          onClick={() => setIsFiltersOpen(true)}
          className={classNames(className, classes.filterDialogButtonDesktop)}
          variant="outlined"
          size="small"
        >
          {t("search:filter_dialog.desktop_title")}
        </Button>

        {filterDialog}
      </div>
    </>
  );
}
