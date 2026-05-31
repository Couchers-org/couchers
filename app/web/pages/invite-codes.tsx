import { appGetLayout } from "components/AppRoute";
import InviteCodesPage from "features/auth/InviteCodesPage";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? "en", [
      GLOBAL,
      NOTIFICATIONS,
    ])),
  },
});

export default function Page() {
  return <InviteCodesPage />;
}

Page.getLayout = appGetLayout({
  isPrivate: true,
});
