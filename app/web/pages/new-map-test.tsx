import { translationStaticProps } from "i18n/server-side-translations";
import NewSearchPage from "features/new-search/new-search-page";
import { GLOBAL, PROFILE, SEARCH } from "i18n/namespaces";
import { appGetLayout } from "components/AppRoute";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = translationStaticProps([
  GLOBAL,
  SEARCH,
  PROFILE,
]);

export default function EventsPage() {
  return <NewSearchPage />;
}

EventsPage.getLayout = appGetLayout({ noFooter: true });
