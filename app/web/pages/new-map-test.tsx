import { appGetLayout } from "components/AppRoute";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import NewSearchPage from "features/new-search/new-search-page";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [GLOBAL, COMMUNITIES],
      nextI18nextConfig
    )),
  },
});

export default function EventsPage() {
  return <NewSearchPage />;
}

EventsPage.getLayout = appGetLayout({ noFooter: true });
