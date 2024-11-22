import { Chip, Tooltip } from "@mui/material";
import { User } from "proto/api_pb";
import makeStyles from "utils/makeStyles";

import { useBadges } from "../hooks/useBadges";

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
        return (
          <Tooltip key={badge.id} title={badge.description}>
            <Chip
              className={classes.badge}
              label={badge.name}
              style={{ background: badge.color }}
            />
          </Tooltip>
        );
      })}
    </div>
  );
};
