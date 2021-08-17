import { Grid, makeStyles, Typography } from "@material-ui/core";
import Autocomplete from "components/Autocomplete";
import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "components/Dialog";
import Divider from "components/Divider";
import TextField from "components/TextField";
import { HOSTING_STATUS, LAST_ACTIVE } from "features/constants";
import { hostingStatusLabels } from "features/profile/constants";
import LocationAutocomplete from "features/search/LocationAutocomplete";
import useSearchFilters from "features/search/useSearchFilters";
import { LngLat } from "maplibre-gl";
import { HostingStatus } from "proto/api_pb";
import { searchQueryKey } from "queryKeys";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";

import {
  ACCOMODATION_FILTERS,
  APPLY_FILTER,
  FILTER_DIALOG_TITLE,
  HOST_FILTERS,
  LAST_2_WEEKS,
  LAST_3_MONTHS,
  LAST_DAY,
  LAST_MONTH,
  LAST_WEEK,
  NUM_GUESTS,
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
  const { control, handleSubmit } = useForm({ mode: "onBlur" });
  const queryClient = useQueryClient();
  const onSubmit = handleSubmit(() => {
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
    lastActive: lastActiveOptions.find(
      (o) => o.value === searchFilters.active.lastActive
    ),
    hostingStatusOptions: searchFilters.active.hostingStatusOptions,
    numGuests: searchFilters.active.numGuests,
  }).current;

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
          <LocationAutocomplete
            control={control}
            defaultValue={defaultValues.location}
            onChange={(value) => {
              if (value === "") {
                searchFilters.remove("location");
                searchFilters.remove("lat");
                searchFilters.remove("lng");
              } else {
                searchFilters.change("location", value.simplifiedName);
                searchFilters.change("lat", value.location.lat);
                searchFilters.change("lng", value.location.lng);
              }
            }}
          />
          <Divider />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6} className={classes.container}>
              <Typography variant="h3">{HOST_FILTERS}</Typography>
              <Autocomplete
                id="last-active-filter"
                label={LAST_ACTIVE}
                options={lastActiveOptions}
                getOptionLabel={(o) => o.label}
                onChange={(_e, option) =>
                  option
                    ? searchFilters.change("lastActive", option.value)
                    : searchFilters.remove("lastActive")
                }
                defaultValue={defaultValues.lastActive}
                disableClearable={false}
                freeSolo={false}
                multiple={false}
              />
              <Autocomplete<HostingStatus, true, false, false>
                id="host-status-filter"
                label={HOSTING_STATUS}
                options={hostingStatusOptions}
                onChange={(_e, options) => {
                  if (options.length === 0) {
                    searchFilters.remove("hostingStatusOptions");
                  } else {
                    searchFilters.change("hostingStatusOptions", options);
                  }
                }}
                defaultValue={defaultValues.hostingStatusOptions}
                getOptionLabel={(option) => hostingStatusLabels[option]}
                disableClearable={false}
                freeSolo={false}
                multiple={true}
              />
            </Grid>
            <Grid item xs={12} md={6} className={classes.container}>
              <Typography variant="h3">{ACCOMODATION_FILTERS}</Typography>
              <TextField
                type="number"
                variant="standard"
                id="num-guests-filter"
                fullWidth
                label={NUM_GUESTS}
                defaultValue={defaultValues.numGuests}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value);
                  if (value) {
                    searchFilters.change("numGuests", value);
                  } else {
                    searchFilters.remove("numGuests");
                  }
                }}
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
