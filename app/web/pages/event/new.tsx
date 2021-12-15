import { appGetLayout } from "components/AppRoute";
import CreateEventPage from "features/communities/events/CreateEventPage";

export default function EditEventPage() {
  //community id is passed as optional GET param
  return <CreateEventPage />;
}

EditEventPage.getLayout = appGetLayout();
