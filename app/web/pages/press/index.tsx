import { appGetLayout } from "components/AppRoute";
import {
  CONNECTIONS,
  DASHBOARD,
  GLOBAL,
  NOTIFICATIONS,
  PRESS,
  PROFILE,
} from "i18n/namespaces";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import Press from "../../features/press/Press";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [
        CONNECTIONS,
        DASHBOARD,
        GLOBAL,
        // LANDING,
        NOTIFICATIONS,
        PRESS,
        PROFILE,
      ],
      nextI18nextConfig,
    )),
  },
});

export default function PressPage() {
  return <Press />;
}

PressPage.getLayout = appGetLayout();
