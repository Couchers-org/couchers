import {
  Grid,
  InputAdornment,
  makeStyles,
  Theme,
  Typography,
  useMediaQuery,
  useTheme,
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
import LocationAutocomplete from "components/LocationAutocomplete";
import TextField from "components/TextField";
import { hostingStatusLabels } from "features/profile/constants";
import { searchQueryKey } from "features/queryKeys";
import useRouteWithSearchFilters from "features/search/useRouteWithSearchFilters";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { LngLat } from "maplibre-gl";
import { HostingStatus } from "proto/api_pb";
import { Controller, useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { GeocodeResult } from "utils/hooks";
import SearchFilters from "utils/searchFilters";

import { getLastActiveOptions } from "./constants";

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

interface FilterDialogFormData
  extends Omit<SearchFilters, "location" | "lastActive"> {
  location: GeocodeResult | "";
  lastActive: ReturnType<typeof getLastActiveOptions>[number];
}

export default function FilterDialog({
  isOpen,
  onClose,
  searchFilters,
  updateMapBoundingBox,
}: {
  isOpen: boolean;
  onClose(): void;
  searchFilters: ReturnType<typeof useRouteWithSearchFilters>;
  updateMapBoundingBox: (
    newBoundingBox: [number, number, number, number] | undefined
  ) => void;
}) {
  const { t } = useTranslation([GLOBAL, SEARCH]);
  const classes = useStyles();
  const theme = useTheme();
  const { control, handleSubmit, register, setValue, getValues, errors } =
    useForm<FilterDialogFormData>({
      mode: "onBlur",
    });
  const queryClient = useQueryClient();
  const onSubmit = handleSubmit((data) => {
    if (data.location && data.location.bbox) {
      setTimeout(() => {
        updateMapBoundingBox((data.location as GeocodeResult)?.bbox);
      }, theme.transitions.duration.standard);
    }
    if (data.location === "" || !data.location) {
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
    if (!data.lastActive || !data.lastActive.value) {
      searchFilters.remove("lastActive");
    } else {
      searchFilters.change("lastActive", data.lastActive.value);
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

  // This requirement for certain filters to have a location specified
  // should be removed when we show users according to bounding box
  // or have some other solution to the pagination issue #1676
  const validateHasLocation = (
    data: string | number | string[] | number[] | { value: null | unknown }
  ) => {
    if (!data) return true;
    if (data instanceof Array && data.length === 0) return true;
    if (
      typeof data === "object" &&
      !(data instanceof Array) &&
      data.value === null
    )
      return true;
    return getValues("location") === "" || !getValues("location")
      ? t("search:form.missing_location_validation_error")
      : true;
  };

  const isSmDown = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down("sm")
  );

  const lastActiveOptions = getLastActiveOptions(t);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby="filter-dialog-title"
    >
      <DialogTitle id="filter-dialog-title">
        {isSmDown
          ? t("search:filter_dialog.mobile_title")
          : t("search:filter_dialog.desktop_title")}
      </DialogTitle>
      <form onSubmit={onSubmit}>
        <DialogContent>
          <div className={classes.container}>
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
                      bbox: searchFilters.active.bbox as [0, 0, 0, 0],
                    }
                  : ""
              }
              label={t("search:form.location_field_label")}
              fieldError={errors.location?.message}
              disableRegions
            />
            <TextField
              fullWidth
              defaultValue={searchFilters.active.query ?? ""}
              id="keywords-filter"
              label={t("search:form.keywords.field_label")}
              name="query"
              inputRef={register}
              variant="standard"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={t(
                        "search:form.keywords.clear_field_action_a11y_label"
                      )}
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
              <Typography variant="h3">
                {t("search:form.host_filters.title")}
              </Typography>
              <Controller
                control={control}
                name="lastActive"
                defaultValue={
                  lastActiveOptions.find(
                    (o) => o.value === searchFilters.active.lastActive ?? null
                  ) ?? lastActiveOptions[0]
                }
                render={({ onChange, value }) => (
                  <Autocomplete
                    id="last-active-filter"
                    label={t(
                      "search:form.host_filters.last_active_field_label"
                    )}
                    options={lastActiveOptions}
                    getOptionLabel={(o) => o.label}
                    onChange={(_e, option) => onChange(option)}
                    value={value}
                    disableClearable={true}
                    freeSolo={false}
                    multiple={false}
                    //@ts-expect-error - DeepMap bad typing
                    error={errors.lastActive?.message}
                  />
                )}
                rules={{ validate: validateHasLocation }}
              />
              <Controller
                control={control}
                name="hostingStatusOptions"
                defaultValue={searchFilters.active.hostingStatusOptions ?? []}
                render={({ onChange, value }) => (
                  <Autocomplete<HostingStatus, true, false, false>
                    id="host-status-filter"
                    label={t(
                      "search:form.host_filters.hosting_status_field_label"
                    )}
                    options={hostingStatusOptions}
                    onChange={(_e, options) => {
                      onChange(options);
                    }}
                    value={value}
                    getOptionLabel={(option) => hostingStatusLabels(t)[option]}
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
              <Typography variant="h3">
                {t("search:form.accommodation_filters.title")}
              </Typography>
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
                label={t(
                  "search:form.accommodation_filters.guests_field_label"
                )}
                defaultValue={searchFilters.active.numGuests ?? ""}
                error={!!errors.numGuests}
                helperText={errors.numGuests?.message}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button type="submit">{t("search:form.submit_button_label")}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
