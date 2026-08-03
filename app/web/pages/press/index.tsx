import { appGetLayout } from "components/AppRoute";
import Press from "features/press/Press";
import { DASHBOARD, GLOBAL, LANDING, NOTIFICATIONS, PRESS } from "i18n/namespaces";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [DASHBOARD, GLOBAL, LANDING, NOTIFICATIONS, PRESS],
      nextI18nextConfig,
    )),
  },
});

export default function PressPage() {
  return <Press />;
}

PressPage.getLayout = appGetLayout({
  isPrivate: false,
  bottomMargin: "80px",
});
