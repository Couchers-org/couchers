import { appGetLayout } from "components/AppRoute";
import Donations from "features/donations/Donations";

export default function DonatePage() {
  return <Donations />;
}

DonatePage.getLayout = appGetLayout();
