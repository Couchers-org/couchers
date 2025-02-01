import { Card, Typography } from "@mui/material";
import Button from "components/Button";
import UsersList from "components/UsersList";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  cardSection: {
    padding: theme.spacing(2),
  },
  seeAllButton: {
    justifySelf: "center",
  },
}));

export interface EventUsersProps {
  emptyState: string;
  error: RpcError | null;
  hasNextPage?: boolean;
  onSeeAllClick?(): void;
  userIds: number[] | undefined;
  title: string;
}

export default function EventUsers({
  emptyState,
  error,
  hasNextPage,
  onSeeAllClick,
  userIds,
  title,
}: EventUsersProps) {
  const { t } = useTranslation([COMMUNITIES]);
  const classes = useStyles();

  return (
    <Card className={classes.cardSection}>
      <Typography variant="h2">{title}</Typography>
      <UsersList
        error={error}
        userIds={userIds}
        endChildren={
          hasNextPage && (
            <Button className={classes.seeAllButton} onClick={onSeeAllClick}>
              {t("communities:see_all")}
            </Button>
          )
        }
        emptyListChildren={
          <Typography variant="body1">{emptyState}</Typography>
        }
      />
    </Card>
  );
}
