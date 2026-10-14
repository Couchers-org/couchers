import { ArrowBack, ArrowForward, Forum } from "@mui/icons-material";
import { IconButton, styled, Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import { useState } from "react";

import DiscussionListRow, { DiscussionListContainer, DiscussionListRowSkeleton } from "./DiscussionListRow";
import useGetDashboard, { DASHBOARD_PAGE_SIZE } from "./useGetDashboard";

const SectionHeader = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "8px",
});

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
      <SectionHeader>
        <Typography variant="h2" sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
          <Forum sx={{ fontSize: 20, color: "var(--mui-palette-primary-main)" }} />
          {t("dashboard:discussions.community_header")}
        </Typography>
        <div>
          <IconButton
            size="small"
            onClick={() => setCurrentPageIndex((i) => i - 1)}
            disabled={!hasPreviousPage}
            color={hasPreviousPage ? "primary" : "default"}
            aria-label={t("dashboard:prev_page_button_a11y")}
          >
            <ArrowBack fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setCurrentPageIndex((i) => i + 1)}
            disabled={!hasNextPage}
            color={hasNextPage ? "primary" : "default"}
            aria-label={t("dashboard:next_page_button_a11y")}
          >
            <ArrowForward fontSize="small" />
          </IconButton>
        </div>
      </SectionHeader>
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
