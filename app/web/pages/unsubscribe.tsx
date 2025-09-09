// This is a legacy page and can be removed in 2026!
// new links go to quick-link.tsx
import { appGetLayout } from "@/components/AppRoute";
import QuickLink from "@/features/auth/QuickLink";
import { AUTH, GLOBAL } from "@/i18n/namespaces";
import { translationStaticProps } from "@/i18n/server-side-translations";

export const getStaticProps = translationStaticProps([GLOBAL, AUTH]);

const UnsubscribePage = () => {
  return <QuickLink />;
};

UnsubscribePage.getLayout = appGetLayout({ isPrivate: false });

export default UnsubscribePage;
