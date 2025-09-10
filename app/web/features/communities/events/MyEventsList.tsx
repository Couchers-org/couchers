import { Pagination, Typography, styled } from "@mui/material";
import { useState } from "react";

import Alert from "@/components/Alert";
import CenteredSpinner from "@/components/CenteredSpinner/CenteredSpinner";
import TextBody from "@/components/TextBody";
import { EventsType } from "@/features/queryKeys";
import { useTranslation } from "@/i18n";
import { COMMUNITIES } from "@/i18n/namespaces";
import { theme } from "@/theme";

import EventsList from "./EventsList";
import { useListMyEvents } from "./hooks";

const StyledFilterTagContainer = styled("div")(() => ({
  display: "flex",
  alignItems: "center",
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const StyledFilterTag = styled(Typography, {
  shouldForwardProp: (propName) => propName !== "isSelected",
})<{ isSelected: boolean }>(({ isSelected }) => ({
  backgroundColor: isSelected
    ? theme.palette.secondary.main
    : theme.palette.grey[200],
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

const StyledEmptyBody = styled(TextBody)(() => ({
  marginBottom: theme.spacing(2),
}));

const StyledPagination = styled(Pagination)(() => ({
  display: "flex",
  justifyContent: "center",
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const MyEventsList = () => {
  const { t } = useTranslation([COMMUNITIES]);
  const pageSize = 5;

  const [pageNumber, setPageNumber] = useState(1);
  const [eventType, setEventType] = useState<EventsType>("upcoming");
  const [shouldShowCancelled, setShouldShowCancelled] =
    useState<boolean>(false);

  const { data, error, isLoading } = useListMyEvents({
    pastEvents: eventType === "past",
    pageSize,
    pageNumber,
    showCancelled: shouldShowCancelled,
  });

  const hasEvents = data && data.eventsList.length > 0;
  const numPages = Math.ceil((data?.totalItems ?? 0) / pageSize);

  const handlePageNumberChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPageNumber(value);
  };

  const handleFilterPastClick = () => {
    if (eventType === "upcoming") {
      setEventType("past");
    } else {
      setEventType("upcoming");
    }
    setPageNumber(1);
  };

  const handleFilterShowCancelledClick = () => {
    setShouldShowCancelled(!shouldShowCancelled);
    setPageNumber(1);
  };

  return (
    <>
      <StyledFilterTagContainer>
        <StyledFilterTag
          isSelected={eventType === "past"}
          variant="body2"
          onClick={handleFilterPastClick}
        >
          {t("communities:past")}
        </StyledFilterTag>
        <StyledFilterTag
          isSelected={shouldShowCancelled}
          variant="body2"
          onClick={handleFilterShowCancelledClick}
        >
          {t("communities:show_cancelled_events")}
        </StyledFilterTag>
      </StyledFilterTagContainer>
      {!hasEvents && !isLoading && (
        <StyledEmptyBody>{t("communities:events_empty_state")}</StyledEmptyBody>
      )}
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading && <CenteredSpinner minHeight="theme.spacing(20)" />}
      {hasEvents && (
        <>
          <EventsList events={data.eventsList} />
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

export default MyEventsList;
