import { appGetLayout } from "components/AppRoute";
import { ConnectionsPage as ConnectionsPageComponent } from "features/connections";
import { CONNECTIONS, GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticPaths, GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [CONNECTIONS, GLOBAL, NOTIFICATIONS],
      nextI18nextConfig,
    )),
  },
});

//[[...slug]] will be used when we have connections other than friends
export default function ConnectionsPage() {
  return <ConnectionsPageComponent type="friends" />;
}

ConnectionsPage.getLayout = appGetLayout();
