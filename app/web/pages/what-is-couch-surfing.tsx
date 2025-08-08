import { appGetLayout } from "components/AppRoute";
import WhatIsCouchSurfingPage from "features/marketing/WhatIsCouchSurfing/WhatIsCouchSurfingPage";
import { GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { translationStaticProps } from "i18n/server-side-translations";

export const getStaticProps = translationStaticProps([GLOBAL, NOTIFICATIONS]);

export default function WhatIsCouchSurfingRoute() {
  return <WhatIsCouchSurfingPage />;
}

WhatIsCouchSurfingRoute.getLayout = appGetLayout({ isPrivate: false });
