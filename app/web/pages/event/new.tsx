import { appGetLayout } from "components/AppRoute";
import CreateEventPage from "features/communities/events/CreateEventPage";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { COMMUNITIES, DASHBOARD, GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? "en", [GLOBAL, COMMUNITIES, DASHBOARD, NOTIFICATIONS])),
  },
});

export default function EditEventPage() {
  //community id is passed as optional GET param
  return <CreateEventPage />;
}

EditEventPage.getLayout = appGetLayout();
