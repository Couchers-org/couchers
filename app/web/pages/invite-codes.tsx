import { appGetLayout } from "components/AppRoute";
import InviteCodesPage from "features/auth/InviteCodesPage";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { DEFAULT_LOCALE } from "i18n/locales";
import { GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? DEFAULT_LOCALE, [GLOBAL, NOTIFICATIONS])),
  },
});

export default function Page() {
  return <InviteCodesPage />;
}

Page.getLayout = appGetLayout({
  isPrivate: true,
});
