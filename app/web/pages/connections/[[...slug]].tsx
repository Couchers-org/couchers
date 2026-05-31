import { appGetLayout } from "components/AppRoute";
import { ConnectionsPage as ConnectionsPageComponent } from "features/connections";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { CONNECTIONS, GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticPaths, GetStaticProps } from "next";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? "en", [
      CONNECTIONS,
      GLOBAL,
      NOTIFICATIONS,
    ])),
  },
});

//[[...slug]] will be used when we have connections other than friends
export default function ConnectionsPage() {
  return <ConnectionsPageComponent type="friends" />;
}

ConnectionsPage.getLayout = appGetLayout();
