import { appGetLayout } from "components/AppRoute";
import Team from "features/team/Team";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { AUTH, GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? "en", [
      GLOBAL,
      AUTH,
      NOTIFICATIONS,
    ])),
  },
});

export default function TeamPage() {
  return <Team />;
}

TeamPage.getLayout = appGetLayout({
  isPrivate: false,
});
