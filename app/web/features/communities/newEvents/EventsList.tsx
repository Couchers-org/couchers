import mockEvents from "test/fixtures/events.json";

import EventItem from "./EventItem";

const EventsList = () => {
  const renderEventItems = () => {
    return mockEvents.map((event) => (
      <EventItem key={event.eventId} event={event} />
    ));
  };

  return <div>{renderEventItems()}</div>;
};

export default EventsList;
