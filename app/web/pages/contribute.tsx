import { appGetLayout } from "components/AppRoute";
import Contribute from "features/ContributePage";
import { GLOBAL } from "i18n/namespaces";
import { serverSideTranslationProps } from "i18n/server-side-translations";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslationProps(locale ?? "en", [GLOBAL])),
  },
});
export default function ContributePage() {
  return <Contribute />;
}

ContributePage.getLayout = appGetLayout();
