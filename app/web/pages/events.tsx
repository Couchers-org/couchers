import { appGetLayout } from "components/AppRoute";
import EventsPageComponent from "features/communities/events/EventsPage";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", [
      "global",
      "communities",
    ])),
  },
});

export default function EventsPage() {
  return <EventsPageComponent />;
}

EventsPage.getLayout = appGetLayout();
