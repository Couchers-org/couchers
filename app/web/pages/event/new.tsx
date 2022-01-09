import { appGetLayout } from "components/AppRoute";
import CreateEventPage from "features/communities/events/CreateEventPage";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      ["global", "communities"],
      nextI18nextConfig
    )),
  },
});

export default function EditEventPage() {
  //community id is passed as optional GET param
  return <CreateEventPage />;
}

EditEventPage.getLayout = appGetLayout();
