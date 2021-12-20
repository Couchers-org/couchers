import { appGetLayout } from "components/AppRoute";
import Donations from "features/donations/Donations";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", ["global", "donations"])),
  },
});

export default function DonatePage() {
  return <Donations />;
}

DonatePage.getLayout = appGetLayout();
