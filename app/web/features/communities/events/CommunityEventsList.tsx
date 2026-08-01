import { styled } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { CalendarIcon } from "components/Icons";
import StyledLink from "components/StyledLink";
import TextBody from "components/TextBody";
import { Community } from "couchers/proto/communities_pb";
import { Trans, useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { useRouter } from "next/router";
import { routeToNewEvent } from "routes";
import { theme } from "theme";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";

import { SectionTitle } from "../CommunityPage";
import { useListCommunityEvents } from "../hooks";
import LongEventCard from "./LongEventCard";

interface CommunityEventsListProps {
  community: Community.AsObject;
}

const StyledEventsListContainer = styled("div")(() => ({
  display: "grid",
  rowGap: theme.spacing(3),
  [theme.breakpoints.down("sm")]: {
    rowGap: theme.spacing(1.5),
  },
}));

const StyledCreateResourceButton = styled(Button)(() => ({
  margin: theme.spacing(2, 0),
}));

export default function CommunityEventsList({
  community,
}: CommunityEventsListProps) {
  const { t } = useTranslation([COMMUNITIES]);
  const router = useRouter();

  const { data, error, hasNextPage, fetchNextPage, isLoading } =
    useListCommunityEvents({
      communityId: community.communityId,
      pageSize: 5,
      type: "all",
    });

  return (
    <>
      <SectionTitle icon={<CalendarIcon />}>
        {t("communities:events_title")}
      </SectionTitle>
      <StyledCreateResourceButton
        onClick={() => router.push(routeToNewEvent(community.communityId))}
      >
        {t("communities:create_an_event")}
      </StyledCreateResourceButton>
      {error && <Alert severity="error">{error.message}</Alert>}
      <StyledEventsListContainer>
        {isLoading ? (
          <CenteredSpinner />
        ) : hasAtLeastOnePage(data, "eventsList") ? (
          data.pages
            .flatMap((page) => page.eventsList)
            .filter((event) => !event.isCancelled)
            .map((event) => <LongEventCard event={event} key={event.eventId} />)
        ) : (
          !error && (
            <TextBody>
              <Trans
                t={t}
                i18nKey="communities:events_empty_state"
                components={[
                  <StyledLink key="create-link" href={routeToNewEvent()} />,
                ]}
              />
            </TextBody>
          )
        )}
      </StyledEventsListContainer>
      {hasNextPage && (
        <Button
          onClick={() => fetchNextPage()}
          sx={{
            color: theme.palette.common.black,
            borderColor: theme.palette.grey[300],

            "&:hover": {
              borderColor: theme.palette.grey[300],
              backgroundColor: "#3135390A",
            },
          }}
        >
          {t("communities:see_more_events_label")}
        </Button>
      )}
    </>
  );
}
