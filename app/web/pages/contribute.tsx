import { appGetLayout } from "@/components/AppRoute";
import Contribute from "@/features/ContributePage";
import { GLOBAL } from "@/i18n/namespaces";
import { translationStaticProps } from "@/i18n/server-side-translations";

export const getStaticProps = translationStaticProps([GLOBAL]);
const ContributePage = () => {
  return <Contribute />;
};

ContributePage.getLayout = appGetLayout();

export default ContributePage;
