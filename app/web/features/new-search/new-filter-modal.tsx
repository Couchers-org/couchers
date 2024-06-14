import {
    Grid,
    InputAdornment,
    makeStyles,
    Theme,
    Typography,
    useMediaQuery,
    useTheme,
    Select
  } from "@material-ui/core";
  import { MenuItem } from "components/Menu";
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
  // import { hostingStatusLabels } from "features/profile/constants";
  import useRouteWithSearchFilters from "features/search/useRouteWithSearchFilters";
  import { useTranslation } from "i18n";
  import { GLOBAL, SEARCH } from "i18n/namespaces";
  import { LngLat } from "maplibre-gl";
  import { HostingStatus } from "proto/api_pb";
  import { Controller, useForm } from "react-hook-form";
  import { useQueryClient } from "react-query";
  import { GeocodeResult } from "utils/hooks";
  import SearchFilters from "utils/searchFilters";
  import { TFunction } from "i18n";
  import { referencesFilterLabels } from "features/profile/constants";
import { useContext } from "react";
import { mapContext } from "./new-search-page";

  const getLastActiveOptions = (t: TFunction) => [
    { label: t("search:last_active_options.any"), value: 0 },
    { label: t("search:last_active_options.last_day"), value: 1 },
    { label: t("search:last_active_options.last_week"), value: 7 },
    { label: t("search:last_active_options.last_2_weeks"), value: 14 },
    { label: t("search:last_active_options.last_month"), value: 31 },
    { label: t("search:last_active_options.last_3_months"), value: 93 },
  ];

  const hostingStatusLabels = (t: TFunction) => ({
    [HostingStatus.HOSTING_STATUS_CAN_HOST]: t("global:hosting_status.can_host"),
    [HostingStatus.HOSTING_STATUS_MAYBE]: t("global:hosting_status.maybe"),
    [HostingStatus.HOSTING_STATUS_CANT_HOST]: t(
      "global:hosting_status.cant_host"
    ),
  });
   
  const useStyles = makeStyles((theme) => ({
    container: {
      "& > * + *": {
        marginBlockStart: theme.spacing(1),
      },
    },
  }));
  
  interface FilterModalFormData
    extends Omit<SearchFilters, "location" | "lastActive"> {
    location: GeocodeResult | "";
    lastActive: ReturnType<typeof getLastActiveOptions>[number];
  }
  
  export default function NewFilterModal({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    onClose(): void;
  }) {
    const { t } = useTranslation([GLOBAL, SEARCH]);
    const classes = useStyles();
    const {lastActiveFilter, setLastActiveFilter, hostingStatusFilter, setHostingStatusFilter, numberOfGuestsFilter, setNumberOfGuestsFilter} = useContext(mapContext)
    const { control, handleSubmit, register, setValue, getValues, errors } =
      useForm<FilterModalFormData>({
        mode: "onBlur",
      });
    const queryClient = useQueryClient();
  
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
        <form onSubmit={() => {}}>
          <DialogContent>
            <div className={classes.container}>
              <LocationAutocomplete
                control={control}
                name="location"
                defaultValue={""}
                label={t("search:form.location_field_label")}
                fieldError={errors.location?.message}
                disableRegions
              />
              <TextField
                fullWidth
                defaultValue={""}
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
               
                {/* last active */}
                <Select
                  onChange={(e) => setLastActiveFilter(e.target.value)}
                  value={lastActiveFilter}
                >
                  {Object.entries(getLastActiveOptions(t)).map(([index, {label, value}]) => {
                    return <MenuItem key={index} value={value}>
                      {label}
                    </MenuItem>
                  })}
                </Select>

                {/* can host */}
                <Select
                  onChange={(e) => setHostingStatusFilter(e.target.value)}
                  value={hostingStatusFilter}
                >
                  {Object.entries(hostingStatusLabels(t)).map(([key, label]) => {
                    return <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  })}
                </Select>
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
                    valueAsNumber: true
                  })}
                  name="numGuests"
                  fullWidth
                  label={t(
                    "search:form.accommodation_filters.guests_field_label"
                  )}
                  defaultValue={""}
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
  