import { FormControlLabel, Typography, styled } from "@mui/material";
import { useRouter } from "next/router";
import { useState } from "react";

import Alert from "@/components/Alert";
import Button from "@/components/Button";
import CenteredSpinner from "@/components/CenteredSpinner/CenteredSpinner";
import CustomColorSwitch from "@/components/CustomColorSwitch";
import TextBody from "@/components/TextBody";
import { useTranslation } from "@/i18n";
import { COMMUNITIES } from "@/i18n/namespaces";
import { NEW_EVENT_ROUTE } from "@/routes";
import { theme } from "@/theme";
import hasAtLeastOnePage from "@/utils/hasAtLeastOnePage";

import EventCard from "./EventCard";
import { useListAllEvents } from "./hooks";

const StyledWrapper = styled("div")(() => ({
  display: "grid",
  rowGap: theme.spacing(2),
  paddingBlockStart: theme.spacing(1),
  paddingBlockEnd: theme.spacing(5),
  justifyItems: "start",
}));

const StyledCardContainer = styled("div")(() => ({
  display: "grid",
  gap: theme.spacing(2),
  gridTemplateColumns: "1fr",

  [theme.breakpoints.down("sm")]: {
    left: "50%",
    marginLeft: "-50vw",
    marginRight: "-50vw",
    position: "relative",
    right: "50%",
    width: "100vw",
  },
  [theme.breakpoints.up("sm")]: {
    gridTemplateColumns: "repeat(2, 1fr)",
  },
  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: theme.spacing(3),
  },
}));

const StyledEventCard = styled(EventCard)(() => ({
  [theme.breakpoints.down("sm")]: {
    margin: theme.spacing(0, 2, 1, 0),
  },
  flexShrink: 0,
  borderRadius: theme.shape.borderRadius * 2,
  scrollSnapAlign: "start",
  width: "100%",
}));

const StyledMoreEventsButton = styled(Button)(() => ({
  justifySelf: "center",
}));

interface EventsTabProps {
  pastEvents?: boolean;
  tabTitle: string;
}

const EventsTab = ({ pastEvents = false, tabTitle }: EventsTabProps) => {
  const { t } = useTranslation([COMMUNITIES]);
  const router = useRouter();

  const [shouldShowCancelled, setShouldShowCancelled] = useState(false);

  const { data, error, hasNextPage, fetchNextPage, isLoading } =
    useListAllEvents({ pastEvents, showCancelled: shouldShowCancelled });

  const handleShowCancelledClick = () => {
    setShouldShowCancelled(!shouldShowCancelled);
  };

  return (
    <StyledWrapper>
      <Typography variant="h2">{tabTitle}</Typography>
      <FormControlLabel
        control={
          <CustomColorSwitch
            checked={shouldShowCancelled}
            onClick={handleShowCancelledClick}
          />
        }
        label={t("communities:show_cancelled_events")}
      />
      {error && <Alert severity="error">{error.message}</Alert>}
      {!pastEvents && (
        <Button onClick={() => router.push(NEW_EVENT_ROUTE)}>
          {t("communities:create_an_event")}
        </Button>
      )}
      {isLoading ? (
        <CenteredSpinner />
      ) : hasAtLeastOnePage(data, "eventsList") ? (
        <>
          <StyledCardContainer>
            {data.pages
              .flatMap((page) => page.eventsList)
              .map((event) => (
                <StyledEventCard key={event.eventId} event={event} />
              ))}
          </StyledCardContainer>
          {hasNextPage && (
            <StyledMoreEventsButton
              onClick={() => fetchNextPage()}
              sx={{
                color: theme.palette.common.black,
                borderColor: theme.palette.grey[300],

                "&:hover": {
                  borderColor: theme.palette.grey[300],
                  backgroundColor: "#3135390A",
                },
              }}
            >
              {t("communities:see_more_events_label")}
            </StyledMoreEventsButton>
          )}
        </>
      ) : (
        !error && <TextBody>{t("communities:events_empty_state")}</TextBody>
      )}
    </StyledWrapper>
  );
};

export default EventsTab;
