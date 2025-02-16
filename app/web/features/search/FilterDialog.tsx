import { InfoOutlined } from "@mui/icons-material";
import {
  Button,
  DialogActions,
  MenuItem,
  Select,
  SelectChangeEvent,
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
import { SEARCH } from "i18n/namespaces";
import { HostingStatus } from "proto/api_pb";
import { useState } from "react";
import { theme } from "theme";

import { FilterOptions } from "./SearchPage";
import { HostingStatusOptions, lastActiveOptions } from "./utils/constants";

interface FilterDialogProps {
  isOpen: boolean;
  onCloseDialog: () => void;
  onSetFilters: (filters: FilterOptions) => void;
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

const FilterDialog = ({
  isOpen,
  onCloseDialog,
  onSetFilters,
}: FilterDialogProps) => {
  const { t } = useTranslation([SEARCH]);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [acceptsPets, setAcceptsPets] = useState(false);
  const [acceptsKids, setAcceptsKids] = useState(false);
  const [acceptsLastMinRequests, setAcceptsLastMinRequests] = useState(false);
  const [drinkingAllowed, setDrinkingAllowed] = useState(false);
  const [showEmptyProfiles, setShowEmptyProfiles] = useState(true);
  const [lastActive, setLastActive] = useState(
    lastActiveOptions.LAST_ACTIVE_ANY,
  );
  const [hasReferences, setHasReferences] = useState<boolean>(false);
  const [hasStrongVerification, setHasStrongVerification] = useState(false);
  const [hostingStatus, setHostingStatus] = useState<
    HostingStatusOptions[] | undefined
  >();
  const [numberOfGuests, setNumberOfGuests] = useState<number | undefined>();
  const [smokingAllowed, setSmokingAllowed] = useState(false);

  const handleAcceptsPetsChange = () => {
    setAcceptsPets(!acceptsPets);
  };

  const handleAcceptsKidsChange = () => {
    setAcceptsKids(!acceptsKids);
  };

  const handleAcceptsLastMinRequestsChange = () => {
    setAcceptsLastMinRequests(!acceptsLastMinRequests);
  };

  const handleDrinkingAllowedChange = () => {
    setDrinkingAllowed(!drinkingAllowed);
  };

  const handleShowEmptyProfilesChange = () => {
    setShowEmptyProfiles(!showEmptyProfiles);
  };

  const handleLastActiveSelect = (event: SelectChangeEvent<number>) => {
    const value = event.target.value as lastActiveOptions;
    setLastActive(value);
  };

  const handleHasReferencesChange = () => {
    setHasReferences(!hasReferences);
  };

  const handleHasStrongVerificationChange = () => {
    setHasStrongVerification(!hasStrongVerification);
  };

  const handleHostingStatusChange = (
    event: React.MouseEvent<HTMLElement>,
    newHostingStatus: HostingStatusOptions[],
  ) => {
    setHostingStatus(newHostingStatus);
  };

  const handleNumberOfGuestsChange = (value: number | undefined) => {
    setNumberOfGuests(value);
  };

  const handleSmokingAllowedChange = () => {
    setSmokingAllowed(!smokingAllowed);
  };

  const handleClearFilters = () => {
    setAcceptsKids(false);
    setAcceptsPets(false);
    setAcceptsLastMinRequests(false);
    setDrinkingAllowed(false);
    setShowEmptyProfiles(true);
    setLastActive(lastActiveOptions.LAST_ACTIVE_ANY);
    setHasReferences(false);
    setHasStrongVerification(false);
    setHostingStatus(undefined);
    setNumberOfGuests(undefined);
    setSmokingAllowed(false);
  };

  const handleApplyFilters = () => {
    onSetFilters({
      acceptsKids,
      acceptsPets,
      acceptsLastMinRequests,
      drinkingAllowed,
      completeProfile: !showEmptyProfiles,
      lastActive,
      hasReferences,
      hasStrongVerification,
      hostingStatus,
      numGuests: numberOfGuests,
      smokingAllowed,
    });
    onCloseDialog();
  };

  return (
    <StyledDialog
      aria-labelledby="Search Filters Dialog"
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
          <Typography>Filter out empty profiles</Typography>
          <CustomColorSwitch
            checked={!showEmptyProfiles}
            onClick={handleShowEmptyProfilesChange}
            customColor={theme.palette.primary.main}
          />
        </FilterItemRow>
        <FilterItemRow>
          <Typography>Has references</Typography>
          <CustomColorSwitch
            checked={hasReferences}
            onClick={handleHasReferencesChange}
            customColor={theme.palette.primary.main}
          />
        </FilterItemRow>
        <FilterItemRow>
          <Typography>
            Has strong verification{" "}
            <Tooltip title="User has verified their identity with their passport">
              <InfoOutlined
                sx={{
                  fontSize: "16px",
                  color: theme.palette.primary.main,

                  "$:hover": {
                    cursor: "pointer",
                  },
                }}
              />
            </Tooltip>
          </Typography>
          <CustomColorSwitch
            checked={hasStrongVerification}
            onClick={handleHasStrongVerificationChange}
            customColor={theme.palette.primary.main}
          />
        </FilterItemRow>
        <FilterItemRow>
          <Typography>Accepts last minute requests</Typography>
          <CustomColorSwitch
            checked={acceptsLastMinRequests}
            onClick={handleAcceptsLastMinRequestsChange}
            customColor={theme.palette.primary.main}
          />
        </FilterItemRow>
        <Divider />
        <Typography variant="h3" sx={{ marginBottom: theme.spacing(2) }}>
          Rules
        </Typography>
        <FilterItemRow>
          <Typography>Kids allowed</Typography>
          <CustomColorSwitch
            checked={acceptsKids}
            onClick={handleAcceptsKidsChange}
            customColor={theme.palette.primary.main}
          />
        </FilterItemRow>
        <FilterItemRow>
          <Typography>Pets allowed</Typography>
          <CustomColorSwitch
            checked={acceptsPets}
            onClick={handleAcceptsPetsChange}
            customColor={theme.palette.primary.main}
          />
        </FilterItemRow>
        <FilterItemRow>
          <Typography>Smoking allowed</Typography>
          <CustomColorSwitch
            checked={smokingAllowed}
            onClick={handleSmokingAllowedChange}
            customColor={theme.palette.primary.main}
          />
        </FilterItemRow>
        <FilterItemRow>
          <Typography>Alcohol allowed</Typography>
          <CustomColorSwitch
            checked={drinkingAllowed}
            onClick={handleDrinkingAllowedChange}
            customColor={theme.palette.primary.main}
          />
        </FilterItemRow>
        <Divider />
        <Typography variant="h3" sx={{ marginBottom: theme.spacing(2) }}>
          Host filters
        </Typography>
        <FilterItemRow>
          <Typography>Last active</Typography>
          <Select<number>
            id="last_active_filter"
            onChange={handleLastActiveSelect}
            variant="outlined"
            size="small"
            value={lastActive}
          >
            <MenuItem value={lastActiveOptions.LAST_ACTIVE_ANY}>
              {t("search:last_active_options.any")}
            </MenuItem>
            <MenuItem value={lastActiveOptions.LAST_ACTIVE_LAST_DAY}>
              {t("search:last_active_options.last_day")}
            </MenuItem>
            <MenuItem value={lastActiveOptions.LAST_ACTIVE_LAST_WEEK}>
              {t("search:last_active_options.last_week")}
            </MenuItem>
            <MenuItem value={lastActiveOptions.LAST_ACTIVE_LAST_2_WEEKS}>
              {t("search:last_active_options.last_2_weeks")}
            </MenuItem>
            <MenuItem value={lastActiveOptions.LAST_ACTIVE_LAST_MONTH}>
              {t("search:last_active_options.last_month")}
            </MenuItem>
            <MenuItem value={lastActiveOptions.LAST_ACTIVE_LAST_3_MONTHS}>
              {t("search:last_active_options.last_3_months")}
            </MenuItem>
          </Select>
        </FilterItemRow>
        <FilterItemRow>
          <Typography>Hosting status</Typography>
          <ToggleButtonGroup
            onChange={handleHostingStatusChange}
            value={hostingStatus}
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
        <Divider />
        <Typography variant="h3" sx={{ marginBottom: theme.spacing(2) }}>
          Accommodation filters
        </Typography>
        <FilterItemRow>
          <Typography>Number of guests</Typography>
          <PlusMinusSelector
            onChange={handleNumberOfGuestsChange}
            value={numberOfGuests}
          />
        </FilterItemRow>
      </FilterItemsContainer>
      <DialogActions sx={{ display: "flex", justifyContent: "space-between" }}>
        <Button onClick={handleClearFilters}>Clear all</Button>
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
          Apply
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default FilterDialog;
