import { Card, CircularProgress, Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import UserSummary from "components/UserSummary";
import useLiteUsers from "features/userQueries/useLiteUsers";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import makeStyles from "utils/makeStyles";

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
  error: RpcError | null;
  hasNextPage?: boolean;
  isLoading: boolean;
  isUsersRefetching: boolean;
  onSeeAllClick?(): void;
  userIds: number[];
  users: ReturnType<typeof useLiteUsers>["data"];
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
  const { t } = useTranslation([COMMUNITIES]);
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
              {t("communities:see_all")}
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
