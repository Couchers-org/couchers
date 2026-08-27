import { appGetLayout } from "components/AppRoute";
import Donations from "features/donations/Donations";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { DEFAULT_LOCALE } from "i18n/locales";
import { DONATIONS, GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? DEFAULT_LOCALE, [DONATIONS, GLOBAL, NOTIFICATIONS])),
  },
});

export default function DonatePage() {
  return <Donations />;
}

DonatePage.getLayout = appGetLayout({
  isPrivate: false,
  variant: "full-width",
});
