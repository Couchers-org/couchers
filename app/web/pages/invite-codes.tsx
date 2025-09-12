import { appGetLayout } from "components/AppRoute";
import InviteCodesPage from "features/auth/InviteCodesPage";
import { GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import nextI18nextConfig from "../next-i18next.config";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [GLOBAL, NOTIFICATIONS],
      nextI18nextConfig,
    )),
  },
});

export default function Page() {
  return <InviteCodesPage />;
}

Page.getLayout = appGetLayout({
  isPrivate: true,
});
