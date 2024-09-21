import { Typography } from "@material-ui/core";
import { EventsType } from "features/queryKeys";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import mockEvents from "test/fixtures/events.json";

import EventItem from "./EventItem";

interface EventListProps {
  eventType: EventsType;
}

const EventsList = ({ eventType }: EventListProps) => {
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);

  const renderEventItems = () => {
    return mockEvents.map((event) => (
      <EventItem key={event.eventId} event={event} />
    ));
  };

  return (
    <div>
      <Typography variant="h3">
        {eventType === "upcoming"
          ? t("communities:your_upcoming_events")
          : t("communities:your_past_events")}
      </Typography>
      {renderEventItems()}
    </div>
  );
};

export default EventsList;
