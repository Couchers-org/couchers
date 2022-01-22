import { useAuthContext } from "./auth/AuthProvider";
import Dashboard from "./dashboard/Dashboard";
import LandingPage from "./landing/LandingPage";

export default function Index() {
  const { authState } = useAuthContext();
  const isAuthenticated = authState.authenticated;

  if (isAuthenticated) {
    return <Dashboard />;
  } else {
    return <LandingPage />;
  }
}
