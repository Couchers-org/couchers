import { appGetLayout } from "components/AppRoute";
import Team from "features/team/Team";
import { GetStaticProps } from "next";
import nextI18NextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      ["global", "auth"],
      nextI18NextConfig
    )),
  },
});

export default function TeamPage() {
  return <Team />;
}

TeamPage.getLayout = appGetLayout({
  isPrivate: false,
});
