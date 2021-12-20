import { appGetLayout } from "components/AppRoute";
import SearchPageComponent from "features/search/SearchPage";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", ["global", "search"])),
  },
});

export default function SearchPage() {
  return <SearchPageComponent />;
}

SearchPage.getLayout = appGetLayout({ noFooter: true });
