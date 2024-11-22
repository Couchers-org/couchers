import {
  Checkbox,
  Chip,
  FormControlLabel,
  Grid,
  Input,
  InputAdornment,
  SelectChangeEvent,
  Theme,
  Typography,
  useMediaQuery,
} from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
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
  noLeftPadding: {
    paddingLeft: 0,
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

  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: 48 * 4.5 + 8,
        width: 250,
      },
    },
    MenuListProps: {
      className: classes.smallLeftPadding,
    },
  };

  const isSmDown = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down("md")
  );

  const handleNumGuestsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const convertedValue = parseInt(e.target.value);
    const tempNumOfGuest =
      !Number.isNaN(convertedValue) && convertedValue > 0
        ? convertedValue
        : undefined;

    setNumberOfGuestFilter(tempNumOfGuest);
  };

  const handleLastActiveChange = (event: SelectChangeEvent<unknown>) => {
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

              <Select
                id="can_host_status_filter_1"
                variant="outlined"
                label={t("search:form.host_filters.hosting_status_field_label")}
                multiple={true}
                menuItems={true}
                value={hostingStatusFilter}
                onChange={(e) =>
                  setHostingStatusFilter(
                    e.target.value as TypeHostingStatusOptions
                  )
                }
                input={
                  <Input
                    className={classes.inputHostingStatus}
                    id="select-multiple-chip"
                  />
                }
                className={classes.marginBottom}
                native={false}
                renderValue={(selected) => (
                  <div className={classes.chips}>
                    {(selected as TypeHostingStatusOptions).map(
                      // Type coercion bc the selected value type is unknown in the mui Select component
                      (
                        value: Exclude<
                          HostingStatus,
                          | HostingStatus.HOSTING_STATUS_UNKNOWN
                          | HostingStatus.HOSTING_STATUS_UNSPECIFIED
                        >
                      ) => (
                        <Chip
                          key={value}
                          label={getHostingStatusOptions(t)[value]}
                          className={classes.chip}
                        />
                      )
                    )}
                  </div>
                )}
                MenuProps={MenuProps}
                optionLabelMap={getHostingStatusOptions(t)}
                options={[
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
