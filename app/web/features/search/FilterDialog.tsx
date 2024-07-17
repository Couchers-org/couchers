import {
  Grid,
  InputAdornment,
  makeStyles,
  Theme,
  Typography,
  useMediaQuery,
  FormControlLabel,
  Checkbox
} from "@material-ui/core";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "components/Dialog";
import LocationAutocomplete from "components/LocationAutocomplete";
// import { hostingStatusLabels } from "features/profile/constants";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { useTranslation, TFunction } from "i18n";
import SearchFilters from "utils/searchFilters";
import IconButton from "components/IconButton";
import TextField from "components/TextField";
import { HostingStatus } from "proto/api_pb";
import { CrossIcon } from "components/Icons";
import { GeocodeResult } from "utils/hooks";
import { mapContext } from "./SearchPage";
import { useForm } from "react-hook-form";
import Divider from "components/Divider";
import Select from "components/Select";
import Button from "components/Button";
import { useContext } from "react";

enum lastActiveOptions { 
  LAST_ACTIVE_ANY = 0,
  LAST_ACTIVE_LAST_DAY = 1,
  LAST_ACTIVE_LAST_WEEK = 7,
  LAST_ACTIVE_LAST_2_WEEKS = 14,
  LAST_ACTIVE_LAST_MONTH = 31,
  LAST_ACTIVE_LAST_3_MONTHS = 93,
}

const getLastActiveOptions = (t: TFunction) => ({
  [lastActiveOptions.LAST_ACTIVE_ANY]: t("search:last_active_options.any"),
  [lastActiveOptions.LAST_ACTIVE_LAST_DAY]: t("search:last_active_options.last_day"),
  [lastActiveOptions.LAST_ACTIVE_LAST_WEEK]: t("search:last_active_options.last_week"),
  [lastActiveOptions.LAST_ACTIVE_LAST_2_WEEKS]: t("search:last_active_options.last_2_weeks"),
  [lastActiveOptions.LAST_ACTIVE_LAST_MONTH]: t("search:last_active_options.last_month"),
  [lastActiveOptions.LAST_ACTIVE_LAST_3_MONTHS]: t("search:last_active_options.last_3_months"),
});

const hostingStatusLabels = (t: TFunction) => ({
  [HostingStatus.HOSTING_STATUS_UNSPECIFIED]: t("global:hosting_status.any"),
  [HostingStatus.HOSTING_STATUS_CAN_HOST]: t("global:hosting_status.can_host"),
  [HostingStatus.HOSTING_STATUS_MAYBE]: t("global:hosting_status.maybe"),
  [HostingStatus.HOSTING_STATUS_CANT_HOST]: t("global:hosting_status.cant_host"),
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
  lastActive: ReturnType<typeof getLastActiveOptions>[any];
}

export default function FilterDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose(): void;
}) {
  const { t } = useTranslation([GLOBAL, SEARCH]);
  const classes = useStyles();
  const {lastActiveFilter, setLastActiveFilter, hostingStatusFilter, setHostingStatusFilter, setLocationResult, completeProfileFilter, setCompleteProfileFilter, numberOfGuestFilter, setNumberOfGuestFilter} = useContext(mapContext)
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
      <form onSubmit={(e) => {e.preventDefault(); onClose()}}>
        <DialogContent>
          <div className={classes.container}>
            <LocationAutocomplete
              control={control}
              name="location"
              defaultValue={""}
              label={t("search:form.location_field_label")}
              onChange={(e: any) => {
                if (e) {
                  const firstElem = e["bbox"].shift() as number;
                  const lastElem = e["bbox"].pop() as number;
                  e["bbox"].push(firstElem);
                  e["bbox"].unshift(lastElem);
                 
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

              <Select
                id='last_active_filter'
                className={classes.marginBottom}
                value={lastActiveFilter}
                onChange={(e) => setLastActiveFilter(e.target.value)}
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
                id='can_host_status_filter'
                value={hostingStatusFilter}
                onChange={(e) => {
                  setHostingStatusFilter(e.target.value);
                }}
                label={t("search:form.host_filters.hosting_status_field_label")}
                optionLabelMap={hostingStatusLabels(t)}
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
                      setCompleteProfileFilter(!completeProfileFilter)
                    }} />
                }
                label={t('search:form.empty_profile_filters.title')}
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
                  setNumberOfGuestFilter(e.target.value);
                }}
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
