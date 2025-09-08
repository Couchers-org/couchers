import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import nextI18NextConfig from "@/next-i18next.config";

export const serverSideTranslationProps = async (
  locale: string | undefined,
  namespaces: Array<string>,
) =>
  await serverSideTranslations(locale ?? "en", namespaces, nextI18NextConfig);

export const translationStaticProps =
  (namespaces: Array<string>): GetStaticProps =>
  async ({ locale }) => ({
    props: {
      ...(await serverSideTranslationProps(locale, namespaces)),
    },
  });
