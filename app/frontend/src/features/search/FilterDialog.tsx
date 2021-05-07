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
import { LAST_ACTIVE } from "features/constants";
import LocationAutocomplete from "features/search/LocationAutocomplete";
import { LngLat } from "maplibre-gl";
import { searchQueryKey } from "queryKeys";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { useHistory, useLocation } from "react-router-dom";
import { searchRoute } from "routes";

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
} from "./constants";

const lastActiveOptions = [
  { label: LAST_DAY, value: 1 },
  { label: LAST_WEEK, value: 7 },
  { label: LAST_2_WEEKS, value: 14 },
  { label: LAST_MONTH, value: 31 },
  { label: LAST_3_MONTHS, value: 93 },
];

export default function FilterDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose(): void;
}) {
  const location = useLocation();
  const history = useHistory();
  const searchParams = useRef(new URLSearchParams(location.search));
  const { control, handleSubmit } = useForm({ mode: "onBlur" });
  const queryClient = useQueryClient();
  const onSubmit = handleSubmit(() => {
    //necessary because we don't want to cache every search for each filter
    //but we do want react-query to handle pagination
    queryClient.removeQueries(searchQueryKey());
    history.push(`${searchRoute}?${searchParams.current.toString()}`);
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
              searchParams.current.has("location") &&
              searchParams.current.has("lng") &&
              searchParams.current.has("lat")
                ? {
                    name: searchParams.current.get("location")!,
                    simplifiedName: searchParams.current.get("location")!,
                    location: new LngLat(
                      Number.parseFloat(searchParams.current.get("lng")!) || 0,
                      Number.parseFloat(searchParams.current.get("lat")!) || 0
                    ),
                  }
                : undefined
            }
            onChange={(value) => {
              if (value === "") {
                searchParams.current.delete("location");
                searchParams.current.delete("lat");
                searchParams.current.delete("lng");
              } else {
                searchParams.current.set("location", value.simplifiedName);
                searchParams.current.set("lat", value.location.lat.toString());
                searchParams.current.set("lng", value.location.lng.toString());
              }
            }}
          />
          <Divider />
          <Grid container>
            <Grid item xs={12} md={6}>
              <Typography variant="h3">{HOST_FILTERS}</Typography>
              <Autocomplete
                id="last-active-filter"
                label={LAST_ACTIVE}
                options={lastActiveOptions}
                getOptionLabel={(o) => o.label}
                onChange={(_e, option) =>
                  option
                    ? searchParams.current.set(
                        "lastActive",
                        option.value.toString()
                      )
                    : searchParams.current.delete("lastActive")
                }
                defaultValue={lastActiveOptions.find(
                  (o) =>
                    o.value.toString() ===
                    searchParams.current.get("lastActive")
                )}
                disableClearable={false}
                freeSolo={false}
                multiple={false}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h3">{ACCOMODATION_FILTERS}</Typography>
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
