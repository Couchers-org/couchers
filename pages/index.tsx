import AppRoute from "components/AppRoute";
import Home from "features/dashboard/Home";
import { ReactNode } from "react";

export default function HomePage() {
  return <Home />;
}

HomePage.getLayout = function getLayout(page: ReactNode) {
  return <AppRoute isPrivate={true}>{page}</AppRoute>;
};
