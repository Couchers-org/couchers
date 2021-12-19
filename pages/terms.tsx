import { appGetLayout } from "components/AppRoute";
import TOS from "components/TOS";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", ["global"])),
  },
});

export default function TOSPage() {
  return <TOS />;
}

TOSPage.getLayout = appGetLayout({
  isPrivate: false,
});
