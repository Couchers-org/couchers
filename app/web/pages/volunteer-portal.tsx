import { appGetLayout } from "components/AppRoute";
import { GLOBAL } from "i18n/namespaces";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [GLOBAL],
      nextI18nextConfig,
    )),
  },
});

export default function VolunteerPortalPage() {
  return <>{/* @TODO (FB) Implement */}</>;
}

VolunteerPortalPage.getLayout = appGetLayout();
