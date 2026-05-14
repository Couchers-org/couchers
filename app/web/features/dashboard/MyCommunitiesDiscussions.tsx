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
  {
    discussionId: 4,
    slug: "best-cafes-to-work-from",
    title: "Best cafes to work from?",
    content:
      "Moving to the city next month and looking for good spots with reliable wifi and great coffee. Any recommendations from locals?",
    ownerTitle: "Vienna",
    created: {
      seconds: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 7,
      nanos: 0,
    },
    thread: { threadId: 4, numResponses: 9 },
  },
];
const PAGE_SIZE = 3;

const SectionHeader = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "8px",
});

export default function MyCommunitiesDiscussions() {
  const { t } = useTranslation([DASHBOARD]);

  // Pagination state — token stack supports prev navigation.
  // When wired to the real API, pageToken drives the query and
  // nextPageToken comes from the response.
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);
  const [history, setHistory] = useState<(string | undefined)[]>([]);

  // TODO: replace with real query results — use pageToken to drive the API call,
  // get nextPageToken from the response, and remove the mock slicing below.
  const isLoading = false;
  const currentPage = history.length;
  const discussions = MOCK_DISCUSSIONS.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );
  const hasNext = (currentPage + 1) * PAGE_SIZE < MOCK_DISCUSSIONS.length;
  const hasPrev = history.length > 0;

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
        <Typography variant="h2">
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
      {isLoading ? (
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
