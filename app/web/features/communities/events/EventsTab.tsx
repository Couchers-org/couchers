import { FormControlLabel, Typography } from "@material-ui/core";
import classNames from "classnames";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import CustomColorSwitch from "components/CustomColorSwitch";
import TextBody from "components/TextBody";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useState } from "react";
import { newEventRoute } from "routes";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";
import makeStyles from "utils/makeStyles";

import { useCommunityPageStyles } from "../CommunityPage";
import EventCard from "./EventCard";
import { useListAllEvents } from "./hooks";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "grid",
    rowGap: theme.spacing(2),
    paddingBlockStart: theme.spacing(1),
    paddingBlockEnd: theme.spacing(5),
    justifyItems: "start",
  },
  container: {
    [theme.breakpoints.down("xs")]: {
      gridTemplateColumns: "1fr",
      gridGap: theme.spacing(2),
    },
    display: "grid",
  },
  eventsCard: {
    width: "100%",
  },
  moreEventButton: {
    justifySelf: "center",
  },
}));

interface EventsTabProps {
  pastEvents?: boolean;
  tabTitle: string;
}

export default function EventsTab({
  pastEvents = false,
  tabTitle,
}: EventsTabProps) {
  const { t } = useTranslation([COMMUNITIES]);
  const classes = { ...useCommunityPageStyles(), ...useStyles() };
  const router = useRouter();

  const [showCancelled, setShowCancelled] = useState(false);

  const { data, error, hasNextPage, fetchNextPage, isLoading } =
    useListAllEvents({ pastEvents, showCancelled });

  const handleShowCancelledClick = () => {
    setShowCancelled(!showCancelled);
  };

  return (
    <div className={classes.root}>
      <Typography variant="h2">{tabTitle}</Typography>
      <FormControlLabel
        control={
          <CustomColorSwitch
            checked={showCancelled}
            onClick={handleShowCancelledClick}
          />
        }
        label={t("communities:show_cancelled_events")}
      />
      {error && <Alert severity="error">{error.message}</Alert>}
      {!pastEvents && (
        <Button onClick={() => router.push(newEventRoute)}>
          {t("communities:create_an_event")}
        </Button>
      )}
      {isLoading ? (
        <CircularProgress />
      ) : hasAtLeastOnePage(data, "eventsList") ? (
        <>
          <div className={classNames(classes.cardContainer, classes.container)}>
            {data.pages
              .flatMap((page) => page.eventsList)
              .map((event) => (
                <EventCard
                  key={event.eventId}
                  event={event}
                  className={classNames(
                    classes.placeEventCard,
                    classes.eventsCard
                  )}
                />
              ))}
          </div>
          {hasNextPage && (
            <Button
              className={classes.moreEventButton}
              onClick={() => fetchNextPage()}
            >
              {t("communities:see_more_events_label")}
            </Button>
          )}
        </>
      ) : (
        !error && <TextBody>{t("communities:events_empty_state")}</TextBody>
      )}
    </div>
  );
}
