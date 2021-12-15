import { appGetLayout } from "components/AppRoute";
import EventPageComponent from "features/communities/events/EventPage";
import NotFoundPage from "features/NotFoundPage";
import { useRouter } from "next/router";
import stringOrFirstString from "utils/stringOrFirstString";

export default function EventPage() {
  const router = useRouter();

  const parsedId = Number.parseInt(stringOrFirstString(router.query.id) ?? "");
  if (isNaN(parsedId)) return <NotFoundPage />;
  const slug = stringOrFirstString(router.query.slug) ?? "";
  return <EventPageComponent eventId={parsedId} eventSlug={slug} />;
}

EventPage.getLayout = appGetLayout();
