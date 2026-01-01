import { Pagination, styled, Typography } from "@mui/material";
import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HorizontalScroller from "components/HorizontalScroller";
import StyledLink from "components/StyledLink";
import TextBody from "components/TextBody";
import EventCard from "features/communities/events/EventCard";
import { useEventSearch } from "features/communities/events/hooks";
import { Trans, useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import { useState } from "react";
import { routeToNewEvent } from "routes";
import { theme } from "theme";

const StyledCardContainer = styled(HorizontalScroller)(() => ({
  paddingLeft: theme.spacing(1),
  paddingRight: theme.spacing(1),
  [theme.breakpoints.down("sm")]: {
    left: "50%",
    marginLeft: "-50vw",
    marginRight: "-50vw",
    position: "relative",
    right: "50%",
    width: "100vw",
  },
  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: theme.spacing(3),
  },
  [theme.breakpoints.up("sm")]: {
    display: "grid",
    gap: theme.spacing(3),
    gridTemplateColumns: "repeat(2, 1fr)",
  },
}));

const StyledCard = styled(EventCard)(() => ({
  width: "90%",
  [theme.breakpoints.down("md")]: {
    width: "100%",
  },
  [theme.breakpoints.up("sm")]: {
    width: "100%",
  },
  [theme.breakpoints.down("sm")]: {
    margin: theme.spacing(0, 2, 1, 0),
  },
  flexShrink: 0,
  borderRadius: theme.shape.borderRadius * 2,
  scrollSnapAlign: "start",
}));

const StyledWrapper = styled("div")(() => ({
  display: "grid",
  rowGap: theme.spacing(2),
  margin: theme.spacing(2, 0, 3),
}));

const StyledPagination = styled(Pagination)(() => ({
  display: "flex",
  justifyContent: "center",
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const PAGE_SIZE = 4;

export default function MyEvents() {
  const { t } = useTranslation([DASHBOARD]);
  const [pageNumber, setPageNumber] = useState(1);

  const { data, error, isLoading } = useEventSearch({
    pageNumber,
    pageSize: PAGE_SIZE,
    pastEvents: false,
    isMyCommunities: true,
    attending: true,
    organizing: true,
    isOnlineOnly: undefined,
    searchLocation: "",
  });

  const hasEvents = data?.eventsList && data.eventsList.length > 0;
  const numPages = Math.ceil((data?.totalItems ?? 0) / PAGE_SIZE) ?? 1;

  const handlePageNumberChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPageNumber(value);
  };

  return (
    <StyledWrapper>
      <Typography variant="h2">{t("dashboard:upcoming_events")}</Typography>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CenteredSpinner />
      ) : hasEvents ? (
        <>
          <StyledCardContainer>
            {data.eventsList.map((event) => {
              return (
                <StyledCard
                  key={event.eventId}
                  event={event}
                  attendeesCountFormatter={(count) =>
                    t("dashboard:attendees_count", { count })
                  }
                />
              );
            })}
          </StyledCardContainer>
          {numPages > 1 && (
            <StyledPagination
              count={numPages}
              page={pageNumber}
              color="primary"
              onChange={handlePageNumberChange}
              size="large"
            />
          )}
        </>
      ) : (
        !error && (
          <TextBody>
            <Trans
              t={t}
              i18nKey="dashboard:events_empty_state"
              components={[
                <StyledLink key="create-link" href={routeToNewEvent()} />,
              ]}
            />
          </TextBody>
        )
      )}
    </StyledWrapper>
  );
}
