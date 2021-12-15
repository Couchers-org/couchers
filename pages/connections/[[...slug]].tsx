import { appGetLayout } from "components/AppRoute";
import { ConnectionsPage as ConnectionsPageComponent } from "features/connections";

//[[...slug]] will be used when we have connections other than friends
export default function ConnectionsPage() {
  return <ConnectionsPageComponent type="friends" />;
}

ConnectionsPage.getLayout = appGetLayout();
