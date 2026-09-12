import { appGetLayout } from "components/AppRoute";
import Press from "features/press/Press";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { DEFAULT_LOCALE } from "i18n/locales";
import { DASHBOARD, GLOBAL, LANDING, NOTIFICATIONS, PRESS } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? DEFAULT_LOCALE, [DASHBOARD, GLOBAL, LANDING, NOTIFICATIONS, PRESS])),
  },
});

export default function PressPage() {
  return <Press />;
}

PressPage.getLayout = appGetLayout({
  isPrivate: false,
  bottomMargin: "80px",
});
