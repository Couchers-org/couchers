import { appGetLayout } from "components/AppRoute";
import Donations from "features/donations/Donations";
import { DONATIONS, GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [DONATIONS, GLOBAL, NOTIFICATIONS],
      nextI18nextConfig,
    )),
  },
});

export default function DonatePage() {
  return <Donations />;
}

DonatePage.getLayout = appGetLayout({ variant: "full-width" });
