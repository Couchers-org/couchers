import { ChatBubbleOutlined, ChevronRight, Place, Schedule } from "@mui/icons-material";
import { Skeleton, styled } from "@mui/material";
import RelativeTime from "components/RelativeTime";
import getContentSummary from "features/communities/getContentSummary";
import { useTranslation } from "i18n";
import { DASHBOARD, GLOBAL } from "i18n/namespaces";
import Link from "next/link";
import { Discussion } from "proto/discussions_pb";
import { routeToDiscussion } from "routes";

type DiscussionSummary = Pick<
  Discussion.AsObject,
  "discussionId" | "slug" | "title" | "ownerTitle" | "created" | "thread" | "content"
>;

interface DiscussionListRowProps {
  discussion: DiscussionSummary;
}

export const DiscussionListContainer = styled("div")({});

const RowLink = styled(Link)({
  display: "flex",
  alignItems: "center",
  gap: "14px",
  padding: "10px 14px 10px 0",
  textDecoration: "none",
  color: "inherit",
  borderRadius: "8px",
  "&:hover": {
    backgroundColor: "var(--mui-palette-grey-50)",
  },
});

const ContentWrapper = styled("div")({
  flex: 1,
  minWidth: 0,
});

const RowTitle = styled("div")({
  fontSize: "14px",
  fontWeight: 600,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const ContentTeaser = styled("div")({
  fontSize: "12px",
  color: "var(--mui-palette-text-secondary)",
  marginTop: "2px",
  overflow: "hidden",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  lineHeight: 1.4,
});

const MetaLine = styled("div")({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  marginTop: "4px",
  fontSize: "11px",
  color: "var(--mui-palette-text-disabled)",
  overflow: "hidden",
  whiteSpace: "nowrap",
});

const MetaDot = styled("span")({
  flexShrink: 0,
});

const MetaText = styled("span")({
  overflow: "hidden",
  textOverflow: "ellipsis",
  flexShrink: 1,
  minWidth: 0,
});

const SkeletonRow = styled("div")({
  display: "flex",
  alignItems: "center",
  gap: "14px",
  padding: "10px 14px 10px 0",
});

export function DiscussionListRowSkeleton() {
  return (
    <SkeletonRow>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Skeleton width="55%" height={20} />
        <Skeleton width="90%" height={14} sx={{ marginTop: "4px" }} />
        <Skeleton width="70%" height={14} sx={{ marginTop: "2px" }} />
        <Skeleton width="60%" height={14} sx={{ marginTop: "4px" }} />
      </div>
    </SkeletonRow>
  );
}

export default function DiscussionListRow({ discussion }: DiscussionListRowProps) {
  const { t } = useTranslation([DASHBOARD, GLOBAL]);

  const commentCount = discussion.thread?.numResponses ?? 0;
  const teaser = getContentSummary({
    originalContent: discussion.content?.replace(/\n/g, " "),
    maxLength: 300,
  });

  return (
    <RowLink href={routeToDiscussion(discussion.discussionId, discussion.slug)}>
      <ContentWrapper>
        <RowTitle>{discussion.title}</RowTitle>
        {teaser && <ContentTeaser>{teaser}</ContentTeaser>}
        <MetaLine>
          <Place sx={{ fontSize: "11px", flexShrink: 0 }} />
          <MetaText>{discussion.ownerTitle}</MetaText>
          <MetaDot>·</MetaDot>
          <Schedule sx={{ fontSize: "11px", flexShrink: 0 }} />
          <span style={{ flexShrink: 0 }}>{discussion.created && <RelativeTime instant={discussion.created} />}</span>
          <MetaDot>·</MetaDot>
          <ChatBubbleOutlined sx={{ fontSize: "11px", flexShrink: 0 }} />
          <span style={{ flexShrink: 0 }}>
            {t("dashboard:discussions.replies_count_label", {
              count: commentCount,
            })}
          </span>
        </MetaLine>
      </ContentWrapper>
      <ChevronRight
        sx={{
          fontSize: "16px",
          color: "var(--mui-palette-text-secondary)",
          flexShrink: 0,
        }}
      />
    </RowLink>
  );
}
