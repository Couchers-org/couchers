import { Grid, Typography } from "@material-ui/core";
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
import { LngLat } from "maplibre-gl";
import { HostingStatus } from "pb/api_pb";
import { searchQueryKey } from "queryKeys";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { useHistory } from "react-router-dom";
import { searchRoute } from "routes";

import {
  NUM_GUESTS,
  ACCOMODATION_FILTERS,
  APPLY_FILTER,
  FILTER_DIALOG_TITLE,
  HOST_FILTERS,
  LAST_2_WEEKS,
  LAST_3_MONTHS,
  LAST_DAY,
  LAST_MONTH,
  LAST_WEEK,
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

export default function FilterDialog({
  isOpen,
  onClose,
  searchParams,
}: {
  isOpen: boolean;
  onClose(): void;
  searchParams: URLSearchParams;
}) {
  const history = useHistory();
  const { control, handleSubmit } = useForm({ mode: "onBlur" });
  const queryClient = useQueryClient();
  const onSubmit = handleSubmit(() => {
    //necessary because we don't want to cache every search for each filter
    //but we do want react-query to handle pagination
    queryClient.removeQueries(searchQueryKey());
    history.push(`${searchRoute}?${searchParams.toString()}`);
    onClose();
  });

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby="filter-dialog-title"
    >
      <DialogTitle id="filter-dialog-title">{FILTER_DIALOG_TITLE}</DialogTitle>
      <form onSubmit={onSubmit}>
        <DialogContent>
          <LocationAutocomplete
            control={control}
            defaultValue={
              searchParams.has("location") &&
              searchParams.has("lng") &&
              searchParams.has("lat")
                ? {
                    name: searchParams.get("location")!,
                    simplifiedName: searchParams.get("location")!,
                    location: new LngLat(
                      Number.parseFloat(searchParams.get("lng")!) || 0,
                      Number.parseFloat(searchParams.get("lat")!) || 0
                    ),
                  }
                : undefined
            }
            onChange={(value) => {
              if (value === "") {
                searchParams.delete("location");
                searchParams.delete("lat");
                searchParams.delete("lng");
              } else {
                searchParams.set("location", value.simplifiedName);
                searchParams.set("lat", value.location.lat.toString());
                searchParams.set("lng", value.location.lng.toString());
              }
            }}
          />
          <Divider />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h3">{HOST_FILTERS}</Typography>
              <Autocomplete
                id="last-active-filter"
                label={LAST_ACTIVE}
                options={lastActiveOptions}
                getOptionLabel={(o) => o.label}
                onChange={(_e, option) =>
                  option
                    ? searchParams.set("lastActive", option.value.toString())
                    : searchParams.delete("lastActive")
                }
                defaultValue={lastActiveOptions.find(
                  (o) => o.value.toString() === searchParams.get("lastActive")
                )}
                disableClearable={false}
                freeSolo={false}
                multiple={false}
              />
              <Autocomplete<HostingStatus, true, false, false>
                id="host-status-filter"
                label={HOSTING_STATUS}
                options={hostingStatusOptions}
                onChange={(_e, options) =>
                  options && options.length !== 0
                    ? searchParams.set("hostingStatus", options.join(","))
                    : searchParams.delete("hostingStatus")
                }
                defaultValue={
                  searchParams.has("hostingStatus")
                    ? searchParams
                        .get("hostingStatus")
                        ?.split(",")
                        .map((k) => Number.parseInt(k))
                    : undefined
                }
                getOptionLabel={(option) => hostingStatusLabels[option]}
                disableClearable={false}
                freeSolo={false}
                multiple={true}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h3">{ACCOMODATION_FILTERS}</Typography>
              <TextField
                type="number"
                variant="standard"
                id="num-guests-filter"
                fullWidth
                label={NUM_GUESTS}
                defaultValue={
                  searchParams.has("numGuests")
                    ? searchParams.get("numGuests")
                    : undefined
                }
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value);
                  if (value) {
                    searchParams.set("numGuests", value.toString());
                  } else {
                    searchParams.delete("numGuests");
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
