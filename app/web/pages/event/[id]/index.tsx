import { appGetLayout } from "components/AppRoute";
import EventPageComponent from "features/communities/events/EventPage";
import NotFoundPage from "features/NotFoundPage";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { DEFAULT_LOCALE } from "i18n/locales";
import { COMMUNITIES, GLOBAL, MESSAGES, NOTIFICATIONS, PROFILE } from "i18n/namespaces";
import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import stringOrFirstString from "utils/stringOrFirstString";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? DEFAULT_LOCALE, [
      GLOBAL,
      COMMUNITIES,
      NOTIFICATIONS,
      PROFILE,
      MESSAGES,
    ])),
  },
});

export default function EventPage() {
  const router = useRouter();

  const parsedId = Number.parseInt(stringOrFirstString(router.query.id) ?? "");
  if (isNaN(parsedId)) return <NotFoundPage />;

  // EventPage replaces this with /event/{id}/{slug} once the event loads.
  return <EventPageComponent eventId={parsedId} eventSlug="" />;
}

EventPage.getLayout = appGetLayout();
