import { appGetLayout } from "components/AppRoute";
import Unsubscribe from "features/auth/notifications/Unsubscribe";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { translationStaticProps } from "i18n/server-side-translations";

export const getStaticProps = translationStaticProps([GLOBAL, AUTH]);

export default function UnsubscribePage() {
  return <Unsubscribe />;
}

UnsubscribePage.getLayout = appGetLayout({ isPrivate: false });
