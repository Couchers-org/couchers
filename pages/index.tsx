import { appGetLayout } from "components/AppRoute";
import Home from "features/dashboard/Home";

export default function HomePage() {
  return <Home />;
}

HomePage.getLayout = appGetLayout();
