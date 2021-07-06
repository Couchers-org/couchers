import { Card, CircularProgress, Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import UserSummary from "components/UserSummary";
import useUsers from "features/userQueries/useUsers";
import { Error as GrpcError } from "grpc-web";
import { ListEventOrganizersRes } from "proto/events_pb";
import { eventOrganisersKey } from "queryKeys";
import { useInfiniteQuery } from "react-query";
import { service } from "service";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";
import makeStyles from "utils/makeStyles";

import { NO_ORGANISERS, ORGANISERS, SEE_ALL_ORGANISERS } from "./constants";

const useStyles = makeStyles((theme) => ({
  cardSection: {
    padding: theme.spacing(2),
  },
  organisers: {
    display: "grid",
    marginBlockStart: theme.spacing(2),
    rowGap: theme.spacing(1),
  },
  seeAllButton: {
    justifySelf: "center",
  },
}));

interface EventOrganisersProps {
  eventId: number;
}

export default function EventOrganisers({ eventId }: EventOrganisersProps) {
  const classes = useStyles();

  const {
    data,
    error: organiserIdsError,
    hasNextPage,
    isLoading: isOrganisersIdsLoading,
  } = useInfiniteQuery<ListEventOrganizersRes.AsObject, GrpcError>({
    queryKey: eventOrganisersKey({ eventId, type: "summary" }),
    queryFn: () => service.events.listEventOrganisers(eventId),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
  });

  const organiserIds =
    data?.pages.flatMap((res) => res.organizerUserIdsList) ?? [];
  const { data: organisers, isLoading: isOrganisersLoading } =
    useUsers(organiserIds);

  return (
    <Card className={classes.cardSection}>
      <Typography variant="h2">{ORGANISERS}</Typography>
      {organiserIdsError && (
        <Alert severity="error">{organiserIdsError.message}</Alert>
      )}
      {isOrganisersIdsLoading || isOrganisersLoading ? (
        <CircularProgress />
      ) : hasAtLeastOnePage(data, "organizerUserIdsList") && organisers ? (
        <>
          <div className={classes.organisers}>
            {data.pages
              .flatMap((page) => page.organizerUserIdsList)
              .map((organiserId) => (
                <UserSummary nameOnly user={organisers.get(organiserId)} />
              ))}
            {hasNextPage && (
              <Button className={classes.seeAllButton}>
                {SEE_ALL_ORGANISERS}
              </Button>
            )}
          </div>
        </>
      ) : (
        data &&
        !organiserIdsError && (
          <Typography variant="body1">{NO_ORGANISERS}</Typography>
        )
      )}
    </Card>
  );
}
