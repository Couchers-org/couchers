import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import { appGetLayout } from "@/components/AppRoute";
import CreateEventPage from "@/features/communities/events/CreateEventPage";
import {
  COMMUNITIES,
  DASHBOARD,
  GLOBAL,
  NOTIFICATIONS,
} from "@/i18n/namespaces";
import nextI18nextConfig from "@/next-i18next.config";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [GLOBAL, COMMUNITIES, DASHBOARD, NOTIFICATIONS],
      nextI18nextConfig,
    )),
  },
});

const EditEventPage = () => {
  // community id is passed as optional GET param
  return <CreateEventPage />;
};

EditEventPage.getLayout = appGetLayout();

export default EditEventPage;
