import { Card, CircularProgress, Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import UserSummary from "components/UserSummary";
import useUsers from "features/userQueries/useUsers";
import { Error as GrpcError } from "grpc-web";
import makeStyles from "utils/makeStyles";

import { SEE_ALL } from "./constants";

const useStyles = makeStyles((theme) => ({
  cardSection: {
    padding: theme.spacing(2),
  },
  users: {
    display: "grid",
    marginBlockStart: theme.spacing(2),
    rowGap: theme.spacing(1),
  },
  seeAllButton: {
    justifySelf: "center",
  },
}));

export interface EventUsersProps {
  emptyState: string;
  error: GrpcError | null;
  hasNextPage?: boolean;
  isLoading: boolean;
  isUsersRefetching: boolean;
  onSeeAllClick?(): void;
  userIds: number[];
  users: ReturnType<typeof useUsers>["data"];
  title: string;
}

export default function EventUsers({
  emptyState,
  error,
  hasNextPage,
  isLoading,
  isUsersRefetching,
  onSeeAllClick,
  userIds,
  users,
  title,
}: EventUsersProps) {
  const classes = useStyles();

  return (
    <Card className={classes.cardSection}>
      <Typography variant="h2">{title}</Typography>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading && !users ? (
        <CircularProgress />
      ) : userIds.length > 0 && users ? (
        <div className={classes.users}>
          {userIds.map((userId) => {
            const user = users.get(userId);
            return user || isUsersRefetching ? (
              <UserSummary
                headlineComponent="h3"
                key={userId}
                nameOnly
                smallAvatar
                user={user}
              />
            ) : null;
          })}
          {hasNextPage && (
            <Button className={classes.seeAllButton} onClick={onSeeAllClick}>
              {SEE_ALL}
            </Button>
          )}
        </div>
      ) : (
        userIds.length === 0 &&
        !error && <Typography variant="body1">{emptyState}</Typography>
      )}
    </Card>
  );
}
