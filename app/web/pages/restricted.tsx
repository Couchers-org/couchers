import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import { appGetLayout } from "@/components/AppRoute";
import Jail from "@/features/auth/jail/Jail";
import nextI18nextConfig from "@/next-i18next.config";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      ["global", "auth"],
      nextI18nextConfig,
    )),
  },
});

const RestrictedPage = () => {
  return <Jail />;
};

RestrictedPage.getLayout = appGetLayout();

export default RestrictedPage;
