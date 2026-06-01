import { ArrowBack, ArrowForward, Forum } from "@mui/icons-material";
import { IconButton, styled, Typography } from "@mui/material";
import TextBody from "components/TextBody";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import { useState } from "react";

import { useListMyCommunitiesDiscussions } from "../communities/hooks";
import DiscussionListRow, {
  DiscussionListContainer,
  DiscussionListRowSkeleton,
} from "./DiscussionListRow";

const PAGE_SIZE = 3;

const SectionHeader = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "8px",
});

export default function MyCommunitiesDiscussions() {
  const { t } = useTranslation([DASHBOARD]);

  const [pageToken, setPageToken] = useState<string | undefined>(undefined);
  const [history, setHistory] = useState<(string | undefined)[]>([]);

  const currentPage = history.length;

  const { data, isPending } = useListMyCommunitiesDiscussions({
    pageSize: PAGE_SIZE,
    pageToken,
  });

  const nextPageToken = data?.nextPageToken;
  const discussions =
    data?.discussionsList.slice(
      currentPage * PAGE_SIZE,
      (currentPage + 1) * PAGE_SIZE,
    ) || [];

  const hasNext =
    Boolean(nextPageToken) ||
    (data?.discussionsList.length ?? 0) > (currentPage + 1) * PAGE_SIZE;
  const hasPrev = currentPage > 0;

  const goNext = () => {
    setHistory((h) => [...h, pageToken]);
    setPageToken(String(currentPage + 1));
  };

  const goPrev = () => {
    setHistory((h) => {
      const prev = [...h];
      const token = prev.pop();
      setPageToken(token);
      return prev;
    });
  };

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
            onClick={goPrev}
            disabled={!hasPrev}
            color={hasPrev ? "primary" : "default"}
            aria-label={t("dashboard:discussions.prev_page_label")}
          >
            <ArrowBack fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={goNext}
            disabled={!hasNext}
            color={hasNext ? "primary" : "default"}
            aria-label={t("dashboard:discussions.next_page_label")}
          >
            <ArrowForward fontSize="small" />
          </IconButton>
        </div>
      </SectionHeader>
      {isPending ? (
        <DiscussionListContainer>
          {[0, 1, 2].map((i) => (
            <DiscussionListRowSkeleton key={i} />
          ))}
        </DiscussionListContainer>
      ) : discussions.length > 0 ? (
        <DiscussionListContainer>
          {discussions.map((d) => (
            <DiscussionListRow key={d.discussionId} discussion={d} />
          ))}
        </DiscussionListContainer>
      ) : (
        <TextBody>
          {t("dashboard:discussions.community_empty_message")}
        </TextBody>
      )}
    </div>
  );
}
