import { Forum } from "@mui/icons-material";
import { styled, Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import { useState } from "react";

import DashboardSectionHeader from "./DashboardSectionHeader";
import DiscussionListRow, { DiscussionListContainer, DiscussionListRowSkeleton } from "./DiscussionListRow";
import useGetDashboard, { DASHBOARD_PAGE_SIZE } from "./useGetDashboard";

const EmptyStateRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  border: "1px dashed var(--mui-palette-divider)",
  borderRadius: 10,
  background: "var(--mui-palette-grey-50)",
}));

export default function MyCommunitiesDiscussions() {
  const { t } = useTranslation([DASHBOARD]);

  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const { data: items = [], isLoading } = useGetDashboard((dashboard) => dashboard.discussions?.discussionsList ?? []);

  const currentItems = items.slice(
    currentPageIndex * DASHBOARD_PAGE_SIZE,
    (currentPageIndex + 1) * DASHBOARD_PAGE_SIZE,
  );
  const hasPreviousPage = currentPageIndex > 0;
  const hasNextPage = (currentPageIndex + 1) * DASHBOARD_PAGE_SIZE < items.length;

  return (
    <div>
      <DashboardSectionHeader
        icon={Forum}
        title={t("dashboard:discussions.community_header")}
        hasPrevious={hasPreviousPage}
        hasNext={hasNextPage}
        onPrevious={() => setCurrentPageIndex((i) => i - 1)}
        onNext={() => setCurrentPageIndex((i) => i + 1)}
      />
      {isLoading ? (
        <DiscussionListContainer>
          {[0, 1, 2].map((i) => (
            <DiscussionListRowSkeleton key={i} />
          ))}
        </DiscussionListContainer>
      ) : currentItems?.length ? (
        <DiscussionListContainer>
          {currentItems.map((d) => (
            <DiscussionListRow key={d.discussionId} discussion={d} />
          ))}
        </DiscussionListContainer>
      ) : (
        <EmptyStateRow>
          <Typography variant="body2" sx={{ color: "var(--mui-palette-text-secondary)" }}>
            {t("dashboard:discussions.community_empty_message")}
          </Typography>
        </EmptyStateRow>
      )}
    </div>
  );
}
