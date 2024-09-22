import { Typography } from "@material-ui/core";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import TextBody from "components/TextBody";
import { EventsType } from "features/queryKeys";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";

import { useListAllEvents } from "../events/hooks";
import EventItem from "./EventItem";

interface EventListProps {
  eventType: EventsType;
}

const EventsList = ({ eventType }: EventListProps) => {
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);

  const { data, error, hasNextPage, fetchNextPage, isLoading } =
    useListAllEvents({ pastEvents: eventType === "past" });

  // @TODO - Render my events up top

  const renderAllEvents = () => {
    if (!data) {
      return <TextBody>{t("communities:events_empty_state")}</TextBody>;
    }

    return data.pages
      .flatMap((page) => page.eventsList)
      .map((event) => <EventItem key={event.eventId} event={event} />);
  };

  return (
    <div>
      <Typography variant="h3">
        {eventType === "upcoming"
          ? t("communities:your_upcoming_events")
          : t("communities:your_past_events")}
      </Typography>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? <CircularProgress /> : renderAllEvents()}
    </div>
  );
};

export default EventsList;
