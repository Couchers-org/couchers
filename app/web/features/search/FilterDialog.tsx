import {
  Checkbox,
  FormControlLabel,
  Grid,
  Input,
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
  DialogTitle,
} from "components/Dialog";
import { AgeSlider } from "./AgeSlider";
import IconButton from "components/IconButton";
import { CrossIcon } from "components/Icons";
import LocationAutocomplete from "components/LocationAutocomplete";
import Select from "components/Select";
import TextField from "components/TextField";
import { TFunction, useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { HostingStatus } from "proto/api_pb";
import { Dispatch, SetStateAction, useState } from "react";
import { useForm } from "react-hook-form";
import { GeocodeResult } from "utils/hooks";
import SearchFilters from "utils/searchFilters";

import { lastActiveOptions } from "./constants";
import { TypeHostingStatusOptions } from "./SearchPage";

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

// TODO: needed?
const getHostingStatusOptions = (t: TFunction) => ({
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
    marginBottom: 15
  },
  content: {
    height: "fit-content",
    padding: theme.spacing(3),
    width: "100%",
    paddingTop: 0,
  },
  titleCategory: {
    fontSize: "1.1rem",
  },
  marginBottom: {
    marginBottom: theme.spacing(2),
  },
  smallLeftPadding: {
    "& > li": {
      paddingLeft: 10,
      "&.Mui-selected": {
        backgroundColor: theme.palette.primary.main + 70,
        fontWeight: "bold",
        "&:hover": {
          backgroundColor: theme.palette.primary.main + 90,
        },
      },
    },
  },
  noMargin: {
    margin: 0,
  },
  checkboxPadding: {
    paddingLeft: 0,
    padding: 4,
  },
  inputHostingStatus: {
    minWidth: "160px",
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
  },
  chip: {
    margin: 2,
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
  queryName: string;
  setQueryName: Dispatch<SetStateAction<string>>;
  setLocationResult: Dispatch<SetStateAction<GeocodeResult>>;
  lastActiveFilter: number;
  setLastActiveFilter: Dispatch<SetStateAction<number>>;
  hostingStatusFilter: TypeHostingStatusOptions;
  setHostingStatusFilter: Dispatch<SetStateAction<TypeHostingStatusOptions>>;
  completeProfileFilter: boolean;
  setCompleteProfileFilter: Dispatch<SetStateAction<boolean>>;
  numberOfGuestFilter: number | undefined;
  setNumberOfGuestFilter: Dispatch<SetStateAction<number | undefined>>;
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
  const { control, register, errors } = useForm<FilterModalFormData>({
    mode: "onBlur",
  });

  const isSmDown = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down("sm")
  );

  // TODO: should come from parent
  const [valueSlider, setValueSlider] = useState<number[]>([20, 37]);

  const handleNumGuestsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const convertedValue = parseInt(e.target.value);
    const tempNumOfGuest =
      !Number.isNaN(convertedValue) && convertedValue > 0
        ? convertedValue
        : undefined;

    setNumberOfGuestFilter(tempNumOfGuest);
  };

  const handleLastActiveChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    const value = parseInt(event.target.value as string);
    setLastActiveFilter(value);
  };

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
        <div className={classes.content} >
          <div className={classes.container}>
            <LocationAutocomplete
              control={control}
              name="location"
              size="small"
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
              id="keywords-filter"
              label={t("search:form.keywords.field_label")}
              name="query"
              size="small"
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
          <Grid container spacing={2}>
            <Grid item xs={12} md={6} className={classes.container}>
              <Typography className={classes.titleCategory} variant="h3">
                {t("search:form.host_filters.title")}
              </Typography>

              <Select
                id="last_active_filter"
                variant="standard"
                className={classes.marginBottom}
                value={lastActiveFilter}
                onChange={handleLastActiveChange}
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

              <FormControlLabel
                className={classes.noMargin}
                control={
                  <Checkbox
                    className={classes.checkboxPadding}
                    color="primary"
                    checked={completeProfileFilter}
                    onChange={() => {
                      setCompleteProfileFilter(!completeProfileFilter);
                    }}
                  />
                }
                label={t("search:form.empty_profile_filters.title")}
              />

              <Typography className={classes.titleCategory} variant="h3">
                {t("search:form.hosting_status.title")}
              </Typography>

              <FormControlLabel
                className={classes.noMargin}
                control={
                  <Checkbox
                    className={classes.checkboxPadding}
                    color="primary"
                    checked={completeProfileFilter}
                    onChange={() => {
                      setCompleteProfileFilter(!completeProfileFilter);
                    }}
                  />
                }
                label={t("search:form.hosting_status.accepting_guests")}
              />
              <br />
              <FormControlLabel
                className={classes.noMargin}
                control={
                  <Checkbox
                    className={classes.checkboxPadding}
                    color="primary"
                    checked={completeProfileFilter}
                    onChange={() => {
                      setCompleteProfileFilter(!completeProfileFilter);
                    }}
                  />
                }
                label={t("search:form.hosting_status.maybe_accepting_guests")}
              />
              <br />
              <FormControlLabel
                className={classes.noMargin}
                control={
                  <Checkbox
                    className={classes.checkboxPadding}
                    color="primary"
                    checked={completeProfileFilter}
                    onChange={() => {
                      setCompleteProfileFilter(!completeProfileFilter);
                    }}
                  />
                }
                label={t("search:form.hosting_status.open_meetup")}
              />
              <br />
              <FormControlLabel
                className={classes.noMargin}
                control={
                  <Checkbox
                    className={classes.checkboxPadding}
                    color="primary"
                    checked={completeProfileFilter}
                    onChange={() => {
                      setCompleteProfileFilter(!completeProfileFilter);
                    }}
                  />
                }
                label={t("search:form.hosting_status.can_meetup")}
              />

              <Typography className={classes.titleCategory} variant="h3">
                {t("search:form.age.title")}
              </Typography>

              <AgeSlider
                // ThumbComponent={AirbnbThumbComponent}
                aria-labelledby="range-slider"
                valueLabelDisplay="on"
                defaultValue={[18, 50]}
                min={18}
              />

            </Grid>
            <Grid item xs={12} md={6} className={classes.container}>
              <Typography className={classes.titleCategory} variant="h3">
                {t("search:form.accommodation_filters.title")}
              </Typography>
              <TextField
                className={classes.noMargin}
                type="number"
                variant="outlined"
                size="small"
                id="num-guests-filter"
                value={numberOfGuestFilter}
                inputProps={{ min: 0 }}
                onChange={handleNumGuestsChange}
                inputRef={register({
                  valueAsNumber: true,
                })}
                name="numGuests"
                fullWidth
                label={t(
                  "search:form.accommodation_filters.guests_field_label"
                )}
                error={!!errors.numGuests}
                helperText={errors.numGuests?.message}
              />
              <FormControlLabel
                className={classes.noMargin}
                control={
                  <Checkbox
                    className={classes.checkboxPadding}
                    color="primary"
                    checked={completeProfileFilter}
                    onChange={() => {
                      setCompleteProfileFilter(!completeProfileFilter);
                    }}
                  />
                }
                label={t("search:form.accommodation_filters.private_room")}
              />
              <br />
              <FormControlLabel
                className={classes.noMargin}
                control={
                  <Checkbox
                    className={classes.checkboxPadding}
                    color="primary"
                    checked={completeProfileFilter}
                    onChange={() => {
                      setCompleteProfileFilter(!completeProfileFilter);
                    }}
                  />
                }
                label={t("search:form.accommodation_filters.shared_room")}
              />
              <Typography className={classes.titleCategory} variant="h3">
                {t("search:form.rules.title")}
              </Typography>
              <FormControlLabel
                className={classes.noMargin}
                control={
                  <Checkbox
                    className={classes.checkboxPadding}
                    color="primary"
                    checked={completeProfileFilter}
                    onChange={() => {
                      setCompleteProfileFilter(!completeProfileFilter);
                    }}
                  />
                }
                label={t("search:form.rules.drinking")}
              />
              <br />
              <FormControlLabel
                className={classes.noMargin}
                control={
                  <Checkbox
                    className={classes.checkboxPadding}
                    color="primary"
                    checked={completeProfileFilter}
                    onChange={() => {
                      setCompleteProfileFilter(!completeProfileFilter);
                    }}
                  />
                }
                label={t("search:form.rules.smoking")}
              />
              <br />
              <FormControlLabel
                className={classes.noMargin}
                control={
                  <Checkbox
                    className={classes.checkboxPadding}
                    color="primary"
                    checked={completeProfileFilter}
                    onChange={() => {
                      setCompleteProfileFilter(!completeProfileFilter);
                    }}
                  />
                }
                label={t("search:form.rules.pets")}
              />
              <br />
              <FormControlLabel
                className={classes.noMargin}
                control={
                  <Checkbox
                    className={classes.checkboxPadding}
                    color="primary"
                    checked={completeProfileFilter}
                    onChange={() => {
                      setCompleteProfileFilter(!completeProfileFilter);
                    }}
                  />
                }
                label={t("search:form.rules.kids")}
              />
              <Typography className={classes.titleCategory} variant="h3">
                {t("search:form.other.title")}
              </Typography>
              <FormControlLabel
                className={classes.noMargin}
                control={
                  <Checkbox
                    className={classes.checkboxPadding}
                    color="primary"
                    checked={completeProfileFilter}
                    onChange={() => {
                      setCompleteProfileFilter(!completeProfileFilter);
                    }}
                  />
                }
                label={t("search:form.other.camping")}
              />
              <br />
              <FormControlLabel
                className={classes.noMargin}
                control={
                  <Checkbox
                    className={classes.checkboxPadding}
                    color="primary"
                    checked={completeProfileFilter}
                    onChange={() => {
                      setCompleteProfileFilter(!completeProfileFilter);
                    }}
                  />
                }
                label={t("search:form.other.parking")}
              />
              <br />
              <FormControlLabel
                className={classes.noMargin}
                control={
                  <Checkbox
                    className={classes.checkboxPadding}
                    color="primary"
                    checked={completeProfileFilter}
                    onChange={() => {
                      setCompleteProfileFilter(!completeProfileFilter);
                    }}
                  />
                }
                label={t("search:form.other.wheelchair_accessible")}
              />
            </Grid>
          </Grid>
        </div>
        <DialogActions>
          <Button type="submit">{t("search:form.submit_button_label")}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
