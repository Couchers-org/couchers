import { appGetLayout } from "components/AppRoute";
import Contribute from "features/ContributePage";

export default function ContributePage() {
  return <Contribute />;
}

ContributePage.getLayout = appGetLayout();
