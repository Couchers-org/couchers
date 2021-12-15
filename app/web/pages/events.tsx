import { appGetLayout } from "components/AppRoute";
import EventsPageComponent from "features/communities/events/EventsPage";

export default function EventsPage() {
  return <EventsPageComponent />;
}

EventsPage.getLayout = appGetLayout();
