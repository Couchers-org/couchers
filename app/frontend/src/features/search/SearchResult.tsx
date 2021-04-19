import {
  Card,
  CardActionArea,
  CardContent,
  Hidden,
  Typography,
} from "@material-ui/core";
import classNames from "classnames";
import { CouchIcon, LocationIcon } from "components/Icons";
import UserSummary from "components/UserSummary";
import {
  aboutText,
  hostingStatusLabels,
  meetupStatusLabels,
} from "features/profile/constants";
import {
  LabelsAgeGenderLanguages,
  LabelsReferencesLastActive,
} from "features/user/UserTextAndLabel";
import { User } from "pb/api_pb";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    marginRight: theme.spacing(2),
    marginBottom: theme.spacing(2),
    textDecoration: "none",
    // width: "100%",
  },
  about: {
    margin: `${theme.spacing(2)} 0`,
  },
  card: {},
  statusLabelWrapper: {
    display: "flex",
    "& > div": {
      display: "flex",
    },
  },
  statusLabel: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(2),
  },
}));

interface SearchResultProps {
  className?: string;
  id?: string;
  user: User.AsObject;
  onClick: (user: User.AsObject) => void;
  highlight?: boolean;
}

export default function SearchResult({
  className,
  id,
  user,
  onClick,
  highlight = false,
}: SearchResultProps) {
  const classes = useStyles();
  return (
    <Card
      id={id}
      className={classNames(classes.card, classes.root, className)}
      onClick={() => onClick(user)}
      elevation={highlight ? 4 : undefined}
    >
      <CardActionArea>
        <CardContent>
          <UserSummary user={user} avatarIsLink={false}>
            <div className={classes.statusLabelWrapper}>
              <div>
                <CouchIcon />
                <Typography
                  className={classes.statusLabel}
                  display="inline"
                  variant="subtitle1"
                  color="primary"
                >
                  {hostingStatusLabels[user.hostingStatus]}
                </Typography>
              </div>
              <div>
                <LocationIcon />
                <Typography
                  className={classes.statusLabel}
                  display="inline"
                  variant="subtitle1"
                >
                  {meetupStatusLabels[user.meetupStatus]}
                </Typography>
              </div>
            </div>
          </UserSummary>
          <Typography variant="body1" className={classes.about}>
            {aboutText(user)}
          </Typography>
          <Hidden smDown>
            <LabelsAgeGenderLanguages user={user} />
            <LabelsReferencesLastActive user={user} />
          </Hidden>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
