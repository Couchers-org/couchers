import { appGetLayout } from "components/AppRoute";
import TOS from "components/TOS";

export default function TOSPage() {
  return <TOS />;
}

TOSPage.getLayout = appGetLayout({
  isPrivate: false,
});
