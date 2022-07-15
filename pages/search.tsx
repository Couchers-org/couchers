import { appGetLayout } from "components/AppRoute";
import SearchPageComponent from "features/search/SearchPage";
import { GLOBAL, PROFILE, SEARCH } from "i18n/namespaces";
import { translationStaticProps } from "i18n/server-side-translations";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = translationStaticProps([
  GLOBAL,
  SEARCH,
  PROFILE,
]);

export default function SearchPage() {
  return <SearchPageComponent />;
}

SearchPage.getLayout = appGetLayout({ noFooter: true });
