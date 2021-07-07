import { Card, Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import UserSummary from "components/UserSummary";
import useUsers from "features/userQueries/useUsers";
import { Error as GrpcError } from "grpc-web";
import makeStyles from "utils/makeStyles";

import { SEE_ALL } from "./constants";

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

interface EventUsersProps {
  emptyState: string;
  error: GrpcError | null;
  hasNextPage?: boolean;
  isLoading: boolean;
  userIds: number[];
  users: ReturnType<typeof useUsers>["data"];
  title: string;
}

export default function EventUsers({
  emptyState,
  error,
  hasNextPage,
  isLoading,
  userIds,
  users,
  title,
}: EventUsersProps) {
  const classes = useStyles();

  return (
    <Card className={classes.cardSection}>
      <Typography variant="h2">{title}</Typography>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CircularProgress />
      ) : userIds.length > 0 && users ? (
        <>
          <div className={classes.organisers}>
            {userIds.map((userId) => {
              const user = users.get(userId);
              return user ? (
                <UserSummary key={userId} nameOnly user={user} />
              ) : null;
            })}
            {hasNextPage && (
              <Button className={classes.seeAllButton}>{SEE_ALL}</Button>
            )}
          </div>
        </>
      ) : (
        userIds.length === 0 &&
        !error && <Typography variant="body1">{emptyState}</Typography>
      )}
    </Card>
  );
}
