import { appGetLayout } from "components/AppRoute";
import EventsPageComponent from "features/communities/events/EventsPage";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { COMMUNITIES, GLOBAL, MESSAGES, NOTIFICATIONS, PROFILE } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? "en", [GLOBAL, COMMUNITIES, NOTIFICATIONS, PROFILE, MESSAGES])),
  },
});

export default function EventsPage() {
  return <EventsPageComponent />;
}

EventsPage.getLayout = appGetLayout();
