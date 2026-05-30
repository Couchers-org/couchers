import { appGetLayout } from "components/AppRoute";
import Jail from "features/auth/jail/Jail";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? "en", ["global", "auth"])),
  },
});

export default function RestrictedPage() {
  return <Jail />;
}

RestrictedPage.getLayout = appGetLayout();
