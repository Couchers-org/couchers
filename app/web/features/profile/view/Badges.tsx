import { User } from "proto/api_pb";
import makeStyles from "utils/makeStyles";
import { useBadges } from "features/badges/hooks";
import Badge from "features/badges/Badge";

interface Props {
  user: User.AsObject;
}

const useStyles = makeStyles((theme) => ({
  badgeContainer: {
    marginTop: theme.spacing(1),
  },
  badge: {
    marginInlineStart: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
}));

export const Badges = ({ user }: Props) => {
  const classes = useStyles();
  const { badges } = useBadges();

  if (badges === undefined || user.badgesList === undefined) {
    return <></>;
  }

  return (
    <div className={classes.badgeContainer}>
      {(user.badgesList || []).map((badgeId) => {
        const badge = (badges || {})[badgeId];
        return <Badge key={badge.id} badge={badge} toolChipLinkProps={{ chipProps: { className: classes.badge } }} />;
      })}
    </div>
  );
};
