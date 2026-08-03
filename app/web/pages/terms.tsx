import { appGetLayout } from "components/AppRoute";
import TOS from "components/TOS";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? "en", [GLOBAL, NOTIFICATIONS])),
  },
});

export default function TOSPage() {
  return <TOS />;
}

TOSPage.getLayout = appGetLayout({
  isPrivate: false,
});
