import { Typography } from "@material-ui/core";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import TextBody from "components/TextBody";
import { useAuthContext } from "features/auth/AuthProvider";
import { EventsType } from "features/queryKeys";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";

import { useListMyEvents } from "../events/hooks";
import EventItem from "./EventItem";

interface EventListProps {
  eventType: EventsType;
}

const EventsList = ({ eventType }: EventListProps) => {
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);

  const { data, error, hasNextPage, fetchNextPage, isLoading } =
    useListMyEvents({ pastEvents: eventType === "past", showCancelled: true });

  const {
    authState: { userId },
  } = useAuthContext();

  const renderMyEvents = () => {
    const flatEvents = data?.pages.flatMap((page) => page.eventsList);
    if (
      !data ||
      !data.pages ||
      data.pages.length === 0 ||
      !flatEvents ||
      flatEvents?.length === 0
    ) {
      return <TextBody>{t("communities:events_empty_state")}</TextBody>;
    }

    return flatEvents.map((event) => (
      <EventItem key={event.eventId} event={event} userId={userId} />
    ));
  };

  return (
    <div>
      <Typography variant="h3">
        {eventType === "upcoming"
          ? t("communities:your_upcoming_events")
          : t("communities:your_past_events")}
      </Typography>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? <CircularProgress /> : renderMyEvents()}
    </div>
  );
};

export default EventsList;
