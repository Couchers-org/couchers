import { appGetLayout } from "components/AppRoute";
import EditEventPageComponent from "features/communities/events/EditEventPage";
import NotFoundPage from "features/NotFoundPage";
import { useRouter } from "next/router";
import stringOrFirstString from "utils/stringOrFirstString";

export default function EditEventPage() {
  const router = useRouter();

  const parsedId = Number.parseInt(stringOrFirstString(router.query.id) ?? "");
  if (isNaN(parsedId)) return <NotFoundPage />;

  return <EditEventPageComponent eventId={parsedId} />;
}

EditEventPage.getLayout = appGetLayout();
