import { ArrowBack, ArrowForward } from "@mui/icons-material";
import { IconButton, styled, Typography } from "@mui/material";
import TextBody from "components/TextBody";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import { Discussion } from "proto/discussions_pb";
import { useState } from "react";

import DiscussionListRow, {
  DiscussionListContainer,
  DiscussionListRowSkeleton,
} from "./DiscussionListRow";

// TODO: Replace mock data with real API call once na/backend/list-my-discussions is merged.
// Use useQuery with service.discussions.listMyCommunitiesDiscussions(pageToken, PAGE_SIZE),
// and wire nextPageToken from the response to the hasNext/goNext logic below.
const MOCK_DISCUSSIONS: Pick<
  Discussion.AsObject,
  | "discussionId"
  | "slug"
  | "title"
  | "ownerTitle"
  | "created"
  | "thread"
  | "content"
>[] = [
  {
    discussionId: 1,
    slug: "best-hiking-trails-nearby",
    title: "Best hiking trails nearby?",
    content:
      "Does anyone know good hiking trails within an hour of the city centre? Looking for something suitable for beginners with great views.",
    ownerTitle: "Berlin",
    created: {
      seconds: Math.floor(Date.now() / 1000) - 60 * 60 * 3,
      nanos: 0,
    },
    thread: { threadId: 1, numResponses: 7 },
  },
  {
    discussionId: 2,
    slug: "monthly-meetup-june",
    title: "Monthly meetup — June",
    content:
      "We're organising our monthly meetup for June! Join us for coffee and a chat with fellow travellers and hosts in the area.",
    ownerTitle: "Hamburg",
    created: {
      seconds: Math.floor(Date.now() / 1000) - 60 * 60 * 27,
      nanos: 0,
    },
    thread: { threadId: 2, numResponses: 3 },
  },
  {
    discussionId: 3,
    slug: "tips-for-hosting-first-time",
    title: "Tips for hosting first-time travelers",
    content:
      "I'm about to host my first guest next week and feeling a little nervous. Any tips from experienced hosts on how to make them feel welcome?",
    ownerTitle: "Munich",
    created: {
      seconds: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 4,
      nanos: 0,
    },
    thread: { threadId: 3, numResponses: 15 },
  },
];
const MOCK_NEXT_PAGE_TOKEN: string | undefined = undefined;

const SectionHeader = styled("div")({
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  marginBottom: "8px",
});

const PaginationRow = styled("div")({
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  marginTop: "4px",
  gap: "4px",
});

export default function MyCommunitiesDiscussions() {
  const { t } = useTranslation([DASHBOARD]);

  // Pagination state — token stack supports prev navigation.
  // When wired to the real API, pageToken drives the query and
  // nextPageToken comes from the response.
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);
  const [history, setHistory] = useState<(string | undefined)[]>([]);

  // TODO: replace these with real query results
  const isLoading = false;
  const discussions = MOCK_DISCUSSIONS;
  const nextPageToken: string | undefined = MOCK_NEXT_PAGE_TOKEN;

  const hasPrev = history.length > 0;
  const hasNext = !!nextPageToken;

  const goNext = () => {
    setHistory((h) => [...h, pageToken]);
    setPageToken(nextPageToken);
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
        <Typography variant="h2">
          {t("dashboard:discussions.community_header")}
        </Typography>
      </SectionHeader>
      {isLoading ? (
        <DiscussionListContainer>
          {[0, 1, 2].map((i) => (
            <DiscussionListRowSkeleton key={i} />
          ))}
        </DiscussionListContainer>
      ) : discussions.length > 0 ? (
        <>
          <DiscussionListContainer>
            {discussions.map((d) => (
              <DiscussionListRow key={d.discussionId} discussion={d} />
            ))}
          </DiscussionListContainer>
          {(hasPrev || hasNext) && (
            <PaginationRow>
              <IconButton
                size="small"
                onClick={goPrev}
                disabled={!hasPrev}
                aria-label={t("dashboard:discussions.prev_page_label")}
              >
                <ArrowBack fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={goNext}
                disabled={!hasNext}
                aria-label={t("dashboard:discussions.next_page_label")}
              >
                <ArrowForward fontSize="small" />
              </IconButton>
            </PaginationRow>
          )}
        </>
      ) : (
        <TextBody>
          {t("dashboard:discussions.community_empty_message")}
        </TextBody>
      )}
    </div>
  );
}
