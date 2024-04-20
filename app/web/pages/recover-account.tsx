import { appGetLayout } from "components/AppRoute";
import RecoverAccount from "features/auth/deletion/RecoverAccount";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { translationStaticProps } from "i18n/server-side-translations";

export const getStaticProps = translationStaticProps([GLOBAL, AUTH]);

export default function RecoverAccountPage() {
  return <RecoverAccount />;
}

RecoverAccountPage.getLayout = appGetLayout({ isPrivate: false });
