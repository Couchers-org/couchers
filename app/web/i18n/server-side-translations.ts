import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { DEFAULT_LOCALE } from "i18n/locales";
import { GetStaticProps } from "next";

export const translationStaticProps =
  (namespaces: Array<string>): GetStaticProps =>
  async ({ locale }) => ({
    props: {
      ...(await appServerSideTranslations(locale ?? DEFAULT_LOCALE, namespaces)),
    },
  });
