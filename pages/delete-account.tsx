import { appGetLayout } from "components/AppRoute";
import ConfirmDeleteAccount from "features/auth/deletion/ConfirmDeleteAccount";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { translationStaticProps } from "i18n/server-side-translations";

export const getStaticProps = translationStaticProps([GLOBAL, AUTH]);

export default function ConfirmDeleteAccountPage() {
  return <ConfirmDeleteAccount />;
}

ConfirmDeleteAccountPage.getLayout = appGetLayout({ isPrivate: false });
