import { Pagination, styled, Typography, useMediaQuery } from "@mui/material";
import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import LocationAutocomplete from "components/LocationAutocomplete";
import StyledLink from "components/StyledLink";
import TextBody from "components/TextBody";
import { Trans, useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { routeToNewEvent } from "routes";
import { theme } from "theme";
import { GeocodeResult } from "utils/hooks";

import EventsList from "./EventsList";
import { useEventSearch } from "./hooks";

const StyledLocationSearch = styled(LocationAutocomplete)(() => ({
  marginRight: theme.spacing(2),
  paddingBottom: theme.spacing(2),
}));

const StyledColumn = styled("div")(() => ({
  display: "flex",
  flexDirection: "column",
}));

const StyledRow = styled("div")(() => ({
  display: "flex",
  justifyContent: "space-between",
  width: "100%",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
  },
}));

const StyledFilterTagContainer = styled("div")(() => ({
  display: "flex",
  alignItems: "center",
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const StyledFilterTag = styled(Typography, {
  shouldForwardProp: (propName) => propName !== "isSelected",
})<{ isSelected: boolean }>(({ isSelected }) => ({
  backgroundColor: isSelected ? theme.palette.secondary.main : theme.palette.grey[200],
  color: isSelected ? theme.palette.common.white : theme.palette.text.primary,
  padding: theme.spacing(1, 2),
  textAlign: "center",
  fontWeight: "bold",
  margin: theme.spacing(0.5),
  borderRadius: theme.shape.borderRadius * 6,
  "&:hover": {
    cursor: "pointer",
  },
}));

const StyledLoadingBox = styled("div")(() => ({
  display: "flex",
  justifyContent: "center",
  padding: theme.spacing(2),
  width: "100%",
  minHeight: theme.spacing(20),
}));

const StyledPagination = styled(Pagination)(() => ({
  display: "flex",
  justifyContent: "center",
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const DiscoverEventsList = () => {
  // @TODO - Basically just making the form since LocationAutocomplete required the control prop
  // We don't validate or require this field so it's just a dummy form
  // Too much refactoring needed to change existing components to not require the control prop
  // Might be worth making a new uncontrolled omponent that doesn't require the control prop
  const { control } = useForm<{ location: GeocodeResult | undefined }>({
    mode: "onChange",
  });
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const pageSize = 12;

  const [pageNumber, setPageNumber] = useState(1);
  const [isMyCommunities, setIsMyCommunities] = useState<boolean>(false);
  const [locationResult, setLocationResult] = useState<GeocodeResult | "">("");

  const { data, error, isLoading } = useEventSearch({
    pastEvents: false,
    pageSize,
    pageNumber,
    isMyCommunities,
    searchLocation: locationResult,
    excludeAttending: true,
  });

  const hasEvents = data && data.eventsList && data.eventsList.length > 0;
  const numPages = Math.ceil((data?.totalItems ?? 0) / pageSize) ?? 1;

  const handlePageNumberChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPageNumber(value);
  };

  const handleFilterIsMyCommunitiesClick = () => {
    setIsMyCommunities(!isMyCommunities);
    setPageNumber(1);
  };

  const handleOnChangeAutocomplete = (newLocationResult: GeocodeResult) => {
    if (typeof newLocationResult === "object") {
      setLocationResult(newLocationResult);
    } else {
      setLocationResult("");
    }
    setPageNumber(1);
  };

  const renderLocationAutoComplete = () => (
    <StyledLocationSearch
      control={control}
      name="location"
      defaultValue={typeof locationResult === "object" ? locationResult : ""}
      label={t("global:location_autocomplete.search_location_button")}
      onChange={handleOnChangeAutocomplete}
      fieldError={undefined}
      fullWidth={isMobile}
      preferCity
      biasToUserLocation
      showUseMyLocation
      // Event search filter, not persisted.
      allowFallback
      autocompleteContext="discover-events-list"
      sx={{
        "#location-autocomplete": {
          width: "100%",
        },
      }}
    />
  );

  return (
    <>
      <StyledColumn>
        <Typography variant="h2">{t("communities:discover_events_title")}</Typography>
        <StyledRow>
          <StyledFilterTagContainer>
            <StyledFilterTag isSelected={isMyCommunities} variant="body2" onClick={handleFilterIsMyCommunitiesClick}>
              {t("communities:my_communities")}
            </StyledFilterTag>
          </StyledFilterTagContainer>
          {!isMobile && renderLocationAutoComplete()}
        </StyledRow>
        {isMobile && renderLocationAutoComplete()}
      </StyledColumn>
      {!hasEvents && !isLoading && (
        <TextBody>
          <Trans
            t={t}
            i18nKey="communities:events_empty_state"
            components={{ createEventLink: <StyledLink href={routeToNewEvent()} /> }}
          />
        </TextBody>
      )}
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading && (
        <StyledLoadingBox>
          <CenteredSpinner />
        </StyledLoadingBox>
      )}
      {hasEvents && !isLoading && (
        <>
          <EventsList events={data.eventsList} isVerticalStyle />
          <StyledPagination
            count={numPages}
            page={pageNumber}
            color="primary"
            onChange={handlePageNumberChange}
            size="large"
          />
        </>
      )}
    </>
  );
};

export default DiscoverEventsList;
