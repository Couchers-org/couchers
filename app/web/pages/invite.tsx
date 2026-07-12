import { appGetLayout } from "components/AppRoute";
import Signup from "features/auth/signup/Signup";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { AUTH, GLOBAL, LANDING, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? "en", [
      AUTH,
      GLOBAL,
      LANDING,
      NOTIFICATIONS,
    ])),
  },
});

export default function InvitePage() {
  return <Signup />;
}

InvitePage.getLayout = appGetLayout({
  isPrivate: false,
  noFooter: true,
  variant: "full-width",
});
