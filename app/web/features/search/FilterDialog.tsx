import {
  Checkbox,
  FormControlLabel,
  Grid,
  InputAdornment,
  makeStyles,
  Theme,
  Typography,
  useMediaQuery,
} from "@material-ui/core";
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
import Select from "components/Select";
import TextField from "components/TextField";
import { TFunction, useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { HostingStatus } from "proto/api_pb";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { GeocodeResult } from "utils/hooks";
import SearchFilters from "utils/searchFilters";

import { lastActiveOptions } from "./constants";

const getLastActiveOptions = (t: TFunction) => ({
  [lastActiveOptions.LAST_ACTIVE_ANY]: t("search:last_active_options.any"),
  [lastActiveOptions.LAST_ACTIVE_LAST_DAY]: t(
    "search:last_active_options.last_day"
  ),
  [lastActiveOptions.LAST_ACTIVE_LAST_WEEK]: t(
    "search:last_active_options.last_week"
  ),
  [lastActiveOptions.LAST_ACTIVE_LAST_2_WEEKS]: t(
    "search:last_active_options.last_2_weeks"
  ),
  [lastActiveOptions.LAST_ACTIVE_LAST_MONTH]: t(
    "search:last_active_options.last_month"
  ),
  [lastActiveOptions.LAST_ACTIVE_LAST_3_MONTHS]: t(
    "search:last_active_options.last_3_months"
  ),
});

const getHostingStatusOptions = (t: TFunction) => ({
  [HostingStatus.HOSTING_STATUS_UNSPECIFIED]: t("global:hosting_status.any"),
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
  marginBottom: {
    marginBottom: theme.spacing(2),
  },
  noMargin: {
    margin: 0,
  },
  noLeftPadding: {
    paddingLeft: 0,
  },
}));

interface FilterModalFormData
  extends Omit<SearchFilters, "location" | "lastActive"> {
  location: GeocodeResult | "";
  lastActive: ReturnType<typeof getLastActiveOptions>;
}

interface FilterDialogProps {
  isOpen: boolean;
  onClose(): void;
  queryName: undefined | string;
  setQueryName: Dispatch<SetStateAction<undefined | string>>;
  setLocationResult: Dispatch<SetStateAction<GeocodeResult | undefined>>;
  lastActiveFilter: number;
  setLastActiveFilter: Dispatch<SetStateAction<number>>;
  hostingStatusFilter: number;
  setHostingStatusFilter: Dispatch<SetStateAction<number>>;
  completeProfileFilter: boolean;
  setCompleteProfileFilter: Dispatch<SetStateAction<boolean>>;
  numberOfGuestFilter: undefined;
  setNumberOfGuestFilter: Dispatch<SetStateAction<undefined>>;
}

export default function FilterDialog({
  isOpen,
  onClose,
  queryName,
  setQueryName,
  setLocationResult,
  lastActiveFilter,
  setLastActiveFilter,
  hostingStatusFilter,
  setHostingStatusFilter,
  completeProfileFilter,
  setCompleteProfileFilter,
  numberOfGuestFilter,
  setNumberOfGuestFilter,
}: FilterDialogProps) {
  const { t } = useTranslation([GLOBAL, SEARCH]);
  const classes = useStyles();
  const { control, handleSubmit, register, setValue, getValues, errors } =
    useForm<FilterModalFormData>({
      mode: "onBlur",
    });

  const isSmDown = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down("sm")
  );

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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onClose();
        }}
      >
        <DialogContent>
          <div className={classes.container}>
            <LocationAutocomplete
              control={control}
              name="location"
              defaultValue={""}
              label={t("search:form.location_field_label")}
              onChange={(e) => {
                if (e) {
                  setLocationResult(e);
                }
              }}
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
              onChange={(e) => {
                if (e) {
                  setQueryName(e.target.value);
                }
              }}
              value={queryName}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={t(
                        "search:form.keywords.clear_field_action_a11y_label"
                      )}
                      onClick={() => {
                        setQueryName("");
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

              <Select
                id="last_active_filter"
                className={classes.marginBottom}
                value={lastActiveFilter}
                onChange={(e) => setLastActiveFilter(e.target.value as number)}
                label={t("search:form.host_filters.last_active_field_label")}
                optionLabelMap={getLastActiveOptions(t)}
                options={[
                  lastActiveOptions.LAST_ACTIVE_ANY,
                  lastActiveOptions.LAST_ACTIVE_LAST_DAY,
                  lastActiveOptions.LAST_ACTIVE_LAST_WEEK,
                  lastActiveOptions.LAST_ACTIVE_LAST_2_WEEKS,
                  lastActiveOptions.LAST_ACTIVE_LAST_MONTH,
                  lastActiveOptions.LAST_ACTIVE_LAST_3_MONTHS,
                ]}
              />

              <Select
                id="can_host_status_filter"
                value={hostingStatusFilter}
                onChange={(e) => {
                  setHostingStatusFilter(e.target.value as number);
                }}
                label={t("search:form.host_filters.hosting_status_field_label")}
                optionLabelMap={getHostingStatusOptions(t)}
                options={[
                  HostingStatus.HOSTING_STATUS_UNSPECIFIED,
                  HostingStatus.HOSTING_STATUS_CAN_HOST,
                  HostingStatus.HOSTING_STATUS_MAYBE,
                  HostingStatus.HOSTING_STATUS_CANT_HOST,
                ]}
              />

              <FormControlLabel
                className={classes.noMargin}
                control={
                  <Checkbox
                    className={classes.noLeftPadding}
                    color="primary"
                    checked={completeProfileFilter}
                    onChange={() => {
                      setCompleteProfileFilter(!completeProfileFilter);
                    }}
                  />
                }
                label={t("search:form.empty_profile_filters.title")}
              />
            </Grid>
            <Grid item xs={12} md={6} className={classes.container}>
              <Typography variant="h3">
                {t("search:form.accommodation_filters.title")}
              </Typography>
              <TextField
                className={classes.noMargin}
                type="number"
                variant="standard"
                id="num-guests-filter"
                value={numberOfGuestFilter}
                onChange={(e) => {
                  setNumberOfGuestFilter(
                    e.target.value as unknown as undefined
                  );
                }}
                inputRef={register({
                  valueAsNumber: true,
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
