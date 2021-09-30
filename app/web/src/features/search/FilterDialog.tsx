import {
  Grid,
  InputAdornment,
  makeStyles,
  Typography,
} from "@material-ui/core";
import Autocomplete from "components/Autocomplete";
import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "components/Dialog";
import Divider from "components/Divider";
import IconButton from "components/IconButton";
import { CrossIcon } from "components/Icons";
import TextField from "components/TextField";
import { HOSTING_STATUS, LAST_ACTIVE } from "features/constants";
import { hostingStatusLabels } from "features/profile/constants";
import LocationAutocomplete from "features/search/LocationAutocomplete";
import useSearchFilters, {
  SearchFilters,
} from "features/search/useSearchFilters";
import { LngLat } from "maplibre-gl";
import { HostingStatus } from "proto/api_pb";
import { searchQueryKey } from "queryKeys";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { GeocodeResult } from "utils/hooks";

import {
  ACCOMODATION_FILTERS,
  APPLY_FILTER,
  CLEAR_SEARCH,
  FILTER_DIALOG_TITLE,
  HOST_FILTERS,
  LAST_2_WEEKS,
  LAST_3_MONTHS,
  LAST_DAY,
  LAST_MONTH,
  LAST_WEEK,
  LOCATION,
  MUST_HAVE_LOCATION,
  NUM_GUESTS,
  PROFILE_KEYWORDS,
} from "./constants";

const lastActiveOptions = [
  { label: LAST_DAY, value: 1 },
  { label: LAST_WEEK, value: 7 },
  { label: LAST_2_WEEKS, value: 14 },
  { label: LAST_MONTH, value: 31 },
  { label: LAST_3_MONTHS, value: 93 },
];

const hostingStatusOptions = [
  HostingStatus.HOSTING_STATUS_CAN_HOST,
  HostingStatus.HOSTING_STATUS_MAYBE,
  HostingStatus.HOSTING_STATUS_CANT_HOST,
];

const useStyles = makeStyles((theme) => ({
  container: {
    "& > * + *": {
      marginBlockStart: theme.spacing(1),
    },
  },
}));

interface FilterDialogFormData extends Omit<SearchFilters, "location"> {
  location: GeocodeResult | "";
}

export default function FilterDialog({
  isOpen,
  onClose,
  searchFilters,
}: {
  isOpen: boolean;
  onClose(): void;
  searchFilters: ReturnType<typeof useSearchFilters>;
}) {
  const classes = useStyles();
  const { control, handleSubmit, register, setValue, getValues, errors } =
    useForm<FilterDialogFormData>({
      mode: "onBlur",
    });
  const queryClient = useQueryClient();
  const onSubmit = handleSubmit((data) => {
    if (data.location === "") {
      searchFilters.remove("location");
      searchFilters.remove("lat");
      searchFilters.remove("lng");
    } else {
      searchFilters.change("location", data.location.simplifiedName);
      searchFilters.change("lat", data.location.location.lat);
      searchFilters.change("lng", data.location.location.lng);
    }
    if (data.query === "" || !data.query) {
      searchFilters.remove("query");
    } else {
      searchFilters.change("query", data.query);
    }
    if (!data.lastActive) {
      searchFilters.remove("lastActive");
    } else {
      searchFilters.change("lastActive", data.lastActive);
    }
    if (!data.hostingStatusOptions || data.hostingStatusOptions.length === 0) {
      searchFilters.remove("hostingStatusOptions");
    } else {
      searchFilters.change("hostingStatusOptions", data.hostingStatusOptions);
    }
    if (!data.numGuests) {
      searchFilters.remove("numGuests");
    } else {
      searchFilters.change("numGuests", data.numGuests);
    }
    onClose();
    //necessary because we don't want to cache every search for each filter
    //but we do want react-query to handle pagination
    queryClient.removeQueries(searchQueryKey());
    searchFilters.apply();
  });

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

  // This requirement for certain filters to have a location specified
  // should be removed when we show users according to bounding box
  // or have some other solution to the pagination issue #1676
  const validateHasLocation = (data: any) => {
    if (!data || data.length === 0 || data === "") return true;
    return getValues("location") === "" ? MUST_HAVE_LOCATION : true;
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby="filter-dialog-title"
      keepMounted={true}
    >
      <DialogTitle id="filter-dialog-title">{FILTER_DIALOG_TITLE}</DialogTitle>
      <form onSubmit={onSubmit}>
        <DialogContent>
          <div className={classes.container}>
            <LocationAutocomplete
              control={control}
              name="location"
              defaultValue={defaultValues.location}
              label={LOCATION}
            />
            <TextField
              fullWidth
              defaultValue={defaultValues.keywords}
              id="keywords-filter"
              label={PROFILE_KEYWORDS}
              name="query"
              inputRef={register}
              variant="standard"
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
          </div>
          <Divider />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6} className={classes.container}>
              <Typography variant="h3">{HOST_FILTERS}</Typography>
              <Controller
                control={control}
                name="lastActive"
                defaultValue={defaultValues.lastActive ?? null}
                render={({ onChange }) => (
                  <Autocomplete
                    id="last-active-filter"
                    label={LAST_ACTIVE}
                    options={lastActiveOptions}
                    getOptionLabel={(o) => o.label}
                    onChange={(_e, option) => onChange(option?.value)}
                    defaultValue={defaultValues.lastActive}
                    disableClearable={false}
                    freeSolo={false}
                    multiple={false}
                    error={errors.lastActive?.message}
                  />
                )}
                rules={{ validate: validateHasLocation }}
              />
              <Controller
                control={control}
                name="hostingStatusOptions"
                defaultValue={defaultValues.hostingStatusOptions}
                render={({ onChange }) => (
                  <Autocomplete<HostingStatus, true, false, false>
                    id="host-status-filter"
                    label={HOSTING_STATUS}
                    options={hostingStatusOptions}
                    onChange={(_e, options) => {
                      onChange(options);
                    }}
                    defaultValue={defaultValues.hostingStatusOptions}
                    getOptionLabel={(option) => hostingStatusLabels[option]}
                    disableClearable={false}
                    freeSolo={false}
                    multiple={true}
                    error={
                      //@ts-ignore weird nested field type issue
                      errors.hostingStatusOptions?.message
                    }
                  />
                )}
                rules={{ validate: validateHasLocation }}
              />
            </Grid>
            <Grid item xs={12} md={6} className={classes.container}>
              <Typography variant="h3">{ACCOMODATION_FILTERS}</Typography>
              <TextField
                type="number"
                variant="standard"
                id="num-guests-filter"
                inputRef={register({
                  valueAsNumber: true,
                  validate: validateHasLocation,
                })}
                name="numGuests"
                fullWidth
                label={NUM_GUESTS}
                defaultValue={defaultValues.numGuests}
                error={!!errors.numGuests}
                helperText={errors.numGuests?.message}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button type="submit">{APPLY_FILTER}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
