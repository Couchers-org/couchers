import { appGetLayout } from "components/AppRoute";
import Unsubscribe from "features/auth/QuickLink";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { translationStaticProps } from "i18n/server-side-translations";

export const getStaticProps = translationStaticProps([GLOBAL, AUTH]);

export default function QuickLinkPage() {
  return <Unsubscribe />;
}

QuickLinkPage.getLayout = appGetLayout({ isPrivate: false });
