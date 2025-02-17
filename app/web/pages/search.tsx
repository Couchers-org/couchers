import { appGetLayout } from "components/AppRoute";
import SearchPageComponent from "features/search/SearchPage";
import { GLOBAL, PROFILE, SEARCH } from "i18n/namespaces";
import { translationStaticProps } from "i18n/server-side-translations";
import { GetStaticProps } from "next";
import { useRouter } from "next/router";

export const getStaticProps: GetStaticProps = translationStaticProps([
  GLOBAL,
  SEARCH,
  PROFILE,
]);

export default function SearchPage() {
  const router = useRouter();

  const location = router.query.location as string;

  return <SearchPageComponent locationName={location} />;
}

SearchPage.getLayout = appGetLayout({ noFooter: true, variant: "full-width" });
