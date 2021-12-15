import { appGetLayout } from "components/AppRoute";
import SearchPageComponent from "features/search/SearchPage";

export default function SearchPage() {
  return <SearchPageComponent />;
}

SearchPage.getLayout = appGetLayout({ noFooter: false });
