import { ArrowBack, ArrowForward, Forum } from "@mui/icons-material";
import { IconButton, styled, Typography } from "@mui/material";
import { useInfiniteQuery } from "@tanstack/react-query";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import { ListMyCommunitiesDiscussionsRes } from "proto/discussions_pb";
import { useState } from "react";
import { service } from "service";

import { listMyCommunitiesDiscussionsKey } from "../queryKeys";
import DiscussionListRow, {
  DiscussionListContainer,
  DiscussionListRowSkeleton,
} from "./DiscussionListRow";

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

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery<ListMyCommunitiesDiscussionsRes.AsObject, RpcError>({
      queryKey: [listMyCommunitiesDiscussionsKey],
      queryFn: ({ pageParam: pageToken }) =>
        service.communities.listMyCommunitiesDiscussions({
          pageToken: pageToken as string | undefined,
          pageSize: 3,
        }),
      getNextPageParam: (lastPage) =>
        lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
      initialPageParam: undefined as string | undefined,
    });

  const pages = data?.pages ?? [];
  const isLastLoadedPage =
    pages.length === 0 || currentPageIndex === pages.length - 1;
  const currentItems = pages[currentPageIndex]?.discussionsList;

  const hasPrev = currentPageIndex > 0;
  const hasForward = !isLastLoadedPage || !!hasNextPage;

  const handleNext = () => {
    if (!isLastLoadedPage) {
      setCurrentPageIndex((i) => i + 1);
    } else if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
      setCurrentPageIndex((i) => i + 1);
    }
  };

  const showingSkeleton =
    isLoading || (isFetchingNextPage && currentItems === undefined);

  return (
    <div>
      <SectionHeader>
        <Typography
          variant="h2"
          sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}
        >
          <Forum
            sx={{ fontSize: 20, color: "var(--mui-palette-primary-main)" }}
          />
          {t("dashboard:discussions.community_header")}
        </Typography>
        <div>
          <IconButton
            size="small"
            onClick={() => setCurrentPageIndex((i) => i - 1)}
            disabled={!hasPrev}
            color={hasPrev ? "primary" : "default"}
            aria-label={t("dashboard:prev_page_button_a11y")}
          >
            <ArrowBack fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleNext}
            disabled={!hasForward || isFetchingNextPage}
            color={hasForward ? "primary" : "default"}
            aria-label={t("dashboard:next_page_button_a11y")}
          >
            <ArrowForward fontSize="small" />
          </IconButton>
        </div>
      </SectionHeader>
      {showingSkeleton ? (
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
          <Typography
            variant="body2"
            sx={{ color: "var(--mui-palette-text-secondary)" }}
          >
            {t("dashboard:discussions.community_empty_message")}
          </Typography>
        </EmptyStateRow>
      )}
    </div>
  );
}
