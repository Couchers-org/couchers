import { appGetLayout } from "components/AppRoute";
import { ConnectionsPage as ConnectionsPageComponent } from "features/connections";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { DEFAULT_LOCALE } from "i18n/locales";
import { CONNECTIONS, GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticPaths, GetStaticProps } from "next";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? DEFAULT_LOCALE, [CONNECTIONS, GLOBAL, NOTIFICATIONS])),
  },
});

//[[...slug]] will be used when we have connections other than friends
export default function ConnectionsPage() {
  return <ConnectionsPageComponent />;
}

ConnectionsPage.getLayout = appGetLayout();
