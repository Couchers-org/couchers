import { InfoOutlined } from "@mui/icons-material";
import {
  Button,
  DialogActions,
  MenuItem,
  Select,
  SelectChangeEvent,
  Slider,
  SliderThumb,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { styled, useMediaQuery } from "@mui/system";
import CustomColorSwitch from "components/CustomColorSwitch";
import { Dialog, DialogTitle } from "components/Dialog";
import Divider from "components/Divider";
import IconButton from "components/IconButton";
import { CloseIcon } from "components/Icons";
import PlusMinusSelector from "components/PlusMinusSelector";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { HostingStatus, MeetupStatus, SleepingArrangement } from "proto/api_pb";
import { theme } from "theme";

import { FilterOptions } from "./SearchPage";
import { useMapSearchActions } from "./state/useMapSearchActions";
import {
  DEFAULT_AGE_MAX,
  DEFAULT_AGE_MIN,
  HostingStatusOptions,
  lastActiveOptions,
  SleepingArrangementOptions,
} from "./utils/constants";

interface FilterDialogProps {
  filters: FilterOptions;
  isOpen: boolean;
  onCloseDialog: () => void;
  resetFilters: () => void;
  updateFilter: (filter: FilterOptions) => void;
}

const StyledDialog = styled(Dialog)({
  "& .MuiDialog-paper": {
    borderRadius: "20px",
    width: "100%",
    maxWidth: "50%",
    padding: theme.spacing(1),
  },
});

const FilterItemsContainer = styled("div")({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(1, 2),
  overflowY: "auto",
  maxHeight: "60vh",
});

const FilterItemRow = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  marginBottom: theme.spacing(2),
});

const StyledSlider = styled(Slider)(({ theme }) => ({
  height: 3,
  padding: "13px 0",
  marginLeft: theme.spacing(1.5),
  marginRight: theme.spacing(1.5),

  "& .MuiSlider-thumb": {
    height: 27,
    width: 27,
    backgroundColor: "#fff",
    border: "1px solid currentColor",
    "&:hover": {
      boxShadow: "0 0 0 8px rgba(58, 133, 137, 0.16)",
    },
    "& .thumb-bar": {
      height: 9,
      width: 1,
      backgroundColor: "currentColor",
      marginLeft: 1,
      marginRight: 1,
    },
  },
  "& .MuiSlider-track": {
    height: 3,
  },
  "& .MuiSlider-rail": {
    color: theme.palette.grey[200],
    opacity: 1,
    height: 3,
    ...theme.applyStyles("dark", {
      color: "#bfbfbf",
      opacity: undefined,
    }),
  },
}));

interface SliderThumbComponentProps extends React.HTMLAttributes<unknown> {
  children?: React.ReactNode;
}

function SliderThumbComponent(props: SliderThumbComponentProps) {
  const { children, ...other } = props;
  return (
    <SliderThumb {...other}>
      {children}
      <span className="thumb-bar" />
      <span className="thumb-bar" />
      <span className="thumb-bar" />
    </SliderThumb>
  );
}

const FilterDialog = ({
  filters,
  isOpen,
  onCloseDialog,
  resetFilters,
  updateFilter,
}: FilterDialogProps) => {
  const { t } = useTranslation([GLOBAL, SEARCH]);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { setSearchFilters } = useMapSearchActions();

  const handleAcceptsPetsChange = () => {
    updateFilter({ acceptsPets: !filters.acceptsPets });
  };

  const handleAcceptsKidsChange = () => {
    updateFilter({ acceptsKids: !filters.acceptsKids });
  };

  const handleAcceptsLastMinRequestsChange = () => {
    updateFilter({ acceptsLastMinRequests: !filters.acceptsLastMinRequests });
  };

  const handleAgeRangeChange = (event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      updateFilter({ ageMin: newValue[0], ageMax: newValue[1] });
    }
  };

  const handleDrinkingAllowedChange = (
    event: React.MouseEvent<HTMLElement>,
    newDrinkingAllowed: boolean | undefined,
  ) => {
    updateFilter({ drinkingAllowed: newDrinkingAllowed });
  };

  const handleShowCompleteProfilesOnlyChange = () => {
    updateFilter({ completeProfile: !filters.completeProfile });
  };

  const handleLastActiveSelect = (event: SelectChangeEvent<number>) => {
    const value = event.target.value as lastActiveOptions;
    updateFilter({ lastActive: value });
  };

  const handleHasReferencesChange = () => {
    updateFilter({ hasReferences: !filters.hasReferences });
  };

  const handleHasStrongVerificationChange = () => {
    updateFilter({ hasStrongVerification: !filters.hasStrongVerification });
  };

  const handleHostingStatusChange = (
    event: React.MouseEvent<HTMLElement>,
    newHostingStatus: HostingStatusOptions[],
  ) => {
    updateFilter({ hostingStatus: newHostingStatus });
  };

  const handleMeetupStatusChange = (
    event: React.MouseEvent<HTMLElement>,
    newMeetupStatus: Exclude<
      MeetupStatus,
      | MeetupStatus.MEETUP_STATUS_UNKNOWN
      | MeetupStatus.MEETUP_STATUS_UNSPECIFIED
    >[],
  ) => {
    updateFilter({ meetupStatus: newMeetupStatus });
  };

  const handleNumberOfGuestsChange = (value: number | undefined) => {
    updateFilter({ numGuests: value });
  };

  const handleSleepingArrangementChange = (
    event: React.MouseEvent<HTMLElement>,
    newSleepingArrangement: SleepingArrangementOptions[],
  ) => {
    updateFilter({ sleepingArrangement: newSleepingArrangement });
  };

  const handleSmokesAtHomeChange = (
    event: React.MouseEvent<HTMLElement>,
    newSmokesAtHome: boolean | undefined,
  ) => {
    updateFilter({ smokesAtHome: newSmokesAtHome });
  };

  const handleClearFilters = () => {
    resetFilters();
  };

  const handleApplyFilters = () => {
    setSearchFilters(filters);

    onCloseDialog();
  };

  return (
    <StyledDialog
      aria-labelledby={t("search:filter_dialog.desktop_title")}
      open={isOpen}
      onClose={() => {}}
      title={t("search:filter_dialog.desktop_title")}
    >
      <DialogTitle id="filter-dialog-title">
        {isMobile
          ? t("search:filter_dialog.mobile_title")
          : t("search:filter_dialog.desktop_title")}
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={onCloseDialog}
        sx={(theme) => ({
          position: "absolute",
          right: 8,
          top: 8,
          color: theme.palette.grey[500],
        })}
      >
        <CloseIcon />
      </IconButton>
      <FilterItemsContainer>
        <FilterItemRow>
          <Typography>
            {t("search:form.empty_profile_filters.title")}
          </Typography>
          <CustomColorSwitch
            checked={filters.completeProfile || false}
            onClick={handleShowCompleteProfilesOnlyChange}
            customColor={theme.palette.primary.main}
          />
        </FilterItemRow>
        <FilterItemRow>
          <Typography>
            {t("search:form.host_filters.hosting_status_field_label")}
          </Typography>
          <ToggleButtonGroup
            onChange={handleHostingStatusChange}
            value={filters.hostingStatus}
            aria-label={t(
              "search:form.host_filters.hosting_status_field_label",
            )}
            size="small"
            color="primary"
            sx={{
              borderRadius: 20,
              marginRight: "-5px",
            }}
          >
            <ToggleButton
              value={HostingStatus.HOSTING_STATUS_CAN_HOST}
              aria-label={t("global:hosting_status.can_host")}
              sx={{ borderRadius: "20px 0 0 20px" }}
            >
              {t("global:hosting_status.can_host")}
            </ToggleButton>
            <ToggleButton
              value={HostingStatus.HOSTING_STATUS_MAYBE}
              aria-label={t("global:hosting_status.maybe")}
            >
              {t("global:hosting_status.maybe")}
            </ToggleButton>
            <ToggleButton
              value={HostingStatus.HOSTING_STATUS_CANT_HOST}
              aria-label={t("global:hosting_status.cant_host")}
              sx={{ borderRadius: "0 20px 20px 0" }}
            >
              {t("global:hosting_status.cant_host")}
            </ToggleButton>
          </ToggleButtonGroup>
        </FilterItemRow>
        <FilterItemRow>
          <Typography>
            {t("search:form.host_filters.meetup_status_field_label")}
          </Typography>
          <ToggleButtonGroup
            onChange={handleMeetupStatusChange}
            value={filters.meetupStatus}
            aria-label={t("search:form.host_filters.meetup_status_field_label")}
            size="small"
            color="primary"
            sx={{
              borderRadius: 20,
              marginRight: "-5px",
            }}
          >
            <ToggleButton
              value={MeetupStatus.MEETUP_STATUS_WANTS_TO_MEETUP}
              aria-label={t("global:meetup_status.wants_to_meetup")}
              sx={{ borderRadius: "20px 0 0 20px" }}
            >
              {t("global:meetup_status.wants_to_meetup")}
            </ToggleButton>
            <ToggleButton
              value={MeetupStatus.MEETUP_STATUS_OPEN_TO_MEETUP}
              aria-label={t("global:meetup_status.open_to_meetup")}
            >
              {t("global:meetup_status.open_to_meetup")}
            </ToggleButton>
            <ToggleButton
              value={MeetupStatus.MEETUP_STATUS_DOES_NOT_WANT_TO_MEETUP}
              aria-label={t("global:meetup_status.does_not_want_to_meetup")}
              sx={{ borderRadius: "0 20px 20px 0" }}
            >
              {t("global:meetup_status.does_not_want_to_meetup")}
            </ToggleButton>
          </ToggleButtonGroup>
        </FilterItemRow>
        <FilterItemRow>
          <Typography>
            {t("search:form.host_filters.last_active_field_label")}
          </Typography>
          <Select<number>
            id="last_active_filter"
            onChange={handleLastActiveSelect}
            variant="outlined"
            size="small"
            value={filters.lastActive}
          >
            <MenuItem value={lastActiveOptions.LAST_ACTIVE_ANY}>
              {t("search:last_active_options.any")}
            </MenuItem>
            <MenuItem value={lastActiveOptions.LAST_ACTIVE_LAST_YEAR}>
              {t("search:last_active_options.last_year")}
            </MenuItem>
            <MenuItem value={lastActiveOptions.LAST_ACTIVE_LAST_SIX_MONTHS}>
              {t("search:last_active_options.last_6_months")}
            </MenuItem>
            <MenuItem value={lastActiveOptions.LAST_ACTIVE_LAST_3_MONTHS}>
              {t("search:last_active_options.last_3_months")}
            </MenuItem>
            <MenuItem value={lastActiveOptions.LAST_ACTIVE_LAST_MONTH}>
              {t("search:last_active_options.last_month")}
            </MenuItem>
            <MenuItem value={lastActiveOptions.LAST_ACTIVE_LAST_WEEK}>
              {t("search:last_active_options.last_week")}
            </MenuItem>
          </Select>
        </FilterItemRow>
        <FilterItemRow>
          <Typography>
            {t("search:form.general_filters.has_references")}
          </Typography>
          <CustomColorSwitch
            checked={filters.hasReferences || false}
            onClick={handleHasReferencesChange}
            customColor={theme.palette.primary.main}
          />
        </FilterItemRow>
        <FilterItemRow>
          <Typography>
            {t("search:form.general_filters.has_strong_verification")}
            {!isMobile && (
              <Tooltip title={t("global:strong_verification.helper_text")}>
                <InfoOutlined
                  sx={{
                    fontSize: "16px",
                    color: theme.palette.primary.main,
                    marginLeft: theme.spacing(0.5),

                    "$:hover": {
                      cursor: "pointer",
                    },
                  }}
                />
              </Tooltip>
            )}
          </Typography>
          <CustomColorSwitch
            checked={filters.hasStrongVerification || false}
            onClick={handleHasStrongVerificationChange}
            customColor={theme.palette.primary.main}
          />
        </FilterItemRow>
        <FilterItemRow>
          <Typography>
            {t("search:form.general_filters.accepts_last_minute_requests")}
          </Typography>
          <CustomColorSwitch
            checked={filters.acceptsLastMinRequests || false}
            onClick={handleAcceptsLastMinRequestsChange}
            customColor={theme.palette.primary.main}
          />
        </FilterItemRow>
        <Divider />
        <Typography variant="h3" sx={{ marginBottom: theme.spacing(2) }}>
          {t("search:form.rules.title")}
        </Typography>
        <FilterItemRow>
          <Typography> {t("search:form.rules.kids_allowed")}</Typography>
          <CustomColorSwitch
            checked={filters.acceptsKids || false}
            onClick={handleAcceptsKidsChange}
            customColor={theme.palette.primary.main}
          />
        </FilterItemRow>
        <FilterItemRow>
          <Typography> {t("search:form.rules.pets_allowed")}</Typography>
          <CustomColorSwitch
            checked={filters.acceptsPets || false}
            onClick={handleAcceptsPetsChange}
            customColor={theme.palette.primary.main}
          />
        </FilterItemRow>
        <FilterItemRow>
          <Typography> {t("search:form.rules.smokes_at_home")}</Typography>
          <ToggleButtonGroup
            onChange={handleSmokesAtHomeChange}
            value={filters.smokesAtHome}
            aria-label={t("search:form.rules.smokes_at_home")}
            exclusive
            size="small"
            color="primary"
            sx={{
              borderRadius: 20,
              marginRight: "-5px",
            }}
          >
            <ToggleButton
              value={true}
              aria-label={t("global:yes")}
              sx={{ borderRadius: "20px 0 0 20px" }}
            >
              {t("global:yes")}
            </ToggleButton>
            <ToggleButton
              value={false}
              aria-label={t("global:no")}
              sx={{ borderRadius: "0 20px 20px 0" }}
            >
              {t("global:no")}
            </ToggleButton>
          </ToggleButtonGroup>
        </FilterItemRow>
        <FilterItemRow>
          <Typography> {t("search:form.rules.alcohol_allowed")}</Typography>
          <ToggleButtonGroup
            onChange={handleDrinkingAllowedChange}
            value={filters.drinkingAllowed}
            aria-label={t("search:form.rules.smokes_at_home")}
            exclusive
            size="small"
            color="primary"
            sx={{
              borderRadius: 20,
              marginRight: "-5px",
            }}
          >
            <ToggleButton
              value={true}
              aria-label={t("global:yes")}
              sx={{ borderRadius: "20px 0 0 20px" }}
            >
              {t("global:yes")}
            </ToggleButton>
            <ToggleButton
              value={false}
              aria-label={t("global:no")}
              sx={{ borderRadius: "0 20px 20px 0" }}
            >
              {t("global:no")}
            </ToggleButton>
          </ToggleButtonGroup>
        </FilterItemRow>
        <Divider />
        <Typography variant="h3" sx={{ marginBottom: theme.spacing(2) }}>
          {t("search:form.accommodation_filters.title")}
        </Typography>
        <FilterItemRow>
          <Typography>
            {t("search:form.accommodation_filters.guests_field_label")}
          </Typography>
          <PlusMinusSelector
            onChange={handleNumberOfGuestsChange}
            value={filters.numGuests}
          />
        </FilterItemRow>
        <FilterItemRow>
          <Typography>
            {t("search:form.accommodation_filters.sleeping_arrangement_label")}
          </Typography>
          <ToggleButtonGroup
            onChange={handleSleepingArrangementChange}
            value={filters.sleepingArrangement}
            aria-label={t(
              "search:form.accommodation_filters.sleeping_arrangement_label",
            )}
            size="small"
            color="primary"
            sx={{
              borderRadius: 20,
              marginRight: "-5px",
            }}
          >
            <ToggleButton
              value={SleepingArrangement.SLEEPING_ARRANGEMENT_COMMON}
              aria-label={t(
                "search:form.accommodation_filters.sleeping_arrangement_filters.common",
              )}
              sx={{ borderRadius: "20px 0 0 20px" }}
            >
              {t(
                "search:form.accommodation_filters.sleeping_arrangement_filters.common",
              )}
            </ToggleButton>
            <ToggleButton
              value={SleepingArrangement.SLEEPING_ARRANGEMENT_PRIVATE}
              aria-label={t(
                "search:form.accommodation_filters.sleeping_arrangement_filters.private",
              )}
            >
              {t(
                "search:form.accommodation_filters.sleeping_arrangement_filters.private",
              )}
            </ToggleButton>
            <ToggleButton
              value={SleepingArrangement.SLEEPING_ARRANGEMENT_SHARED_ROOM}
              aria-label={t(
                "search:form.accommodation_filters.sleeping_arrangement_filters.shared_room",
              )}
              sx={{ borderRadius: "0 20px 20px 0" }}
            >
              {t(
                "search:form.accommodation_filters.sleeping_arrangement_filters.shared_room",
              )}
            </ToggleButton>
          </ToggleButtonGroup>
        </FilterItemRow>
        <FilterItemRow>
          <Typography>
            {t("search:form.host_filters.age.field_label")}
          </Typography>
        </FilterItemRow>
        <FilterItemRow>
          <StyledSlider
            getAriaLabel={(index) =>
              index === 0
                ? t("search:form.host_filters.age.min_age")
                : t("search:form.host_filters.age.max_age")
            }
            value={[
              filters.ageMin || DEFAULT_AGE_MIN,
              filters.ageMax || DEFAULT_AGE_MAX,
            ]}
            onChange={handleAgeRangeChange}
            valueLabelDisplay="auto"
            slots={{ thumb: SliderThumbComponent }}
            defaultValue={[DEFAULT_AGE_MIN, DEFAULT_AGE_MAX]}
            min={DEFAULT_AGE_MIN}
            max={DEFAULT_AGE_MAX}
            marks={[
              {
                value: DEFAULT_AGE_MIN,
                label: `${DEFAULT_AGE_MIN}`,
              },
              {
                value: DEFAULT_AGE_MAX,
                label: `${DEFAULT_AGE_MAX}`,
              },
            ]}
          />
        </FilterItemRow>
      </FilterItemsContainer>
      <DialogActions sx={{ display: "flex", justifyContent: "space-between" }}>
        <Button onClick={handleClearFilters}>
          {t("search:form.clear_filters")}
        </Button>
        <Button
          onClick={handleApplyFilters}
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.common.white,

            "&:hover": {
              backgroundColor: theme.palette.primary.dark,
            },
          }}
        >
          {t("search:form.submit_button_label")}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default FilterDialog;
