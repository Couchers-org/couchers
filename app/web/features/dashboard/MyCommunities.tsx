import CommunitiesList from "./CommunitiesList";
import useGetDashboard, { Dashboard } from "./useGetDashboard";

const selectMyCommunities = (dashboard: Dashboard) => dashboard.myCommunities?.communitiesList ?? [];

export default function MyCommunities() {
  const { data: communities = [], isLoading, error } = useGetDashboard(selectMyCommunities);
  return <CommunitiesList communities={communities} isLoading={isLoading} error={error?.message} />;
}
