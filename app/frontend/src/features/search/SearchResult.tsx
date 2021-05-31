import {
  Card,
  CardActionArea,
  CardContent,
  Hidden,
  Typography,
} from "@material-ui/core";
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
import LinesEllipsis from "react-lines-ellipsis";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  about: {
    marginTop: theme.spacing(2),
    marginBottom: 0,
    ...theme.typography.body1,
  },
  statusLabelWrapper: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    "& > div": {
      display: "flex",
    },
  },
  statusIcon: {
    marginInlineEnd: theme.spacing(0.5),
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
      className={className}
      onClick={() => onClick(user)}
      elevation={highlight ? 4 : undefined}
    >
      <CardActionArea>
        <CardContent>
          <UserSummary user={user} avatarIsLink={false}>
            <div className={classes.statusLabelWrapper}>
              <div>
                <Hidden smDown>
                  <CouchIcon className={classes.statusIcon}/>
                </Hidden>
                <Typography
                  display="inline"
                  variant="body1"
                  color="primary"
                >
                  {hostingStatusLabels[user.hostingStatus]}
                </Typography>
              </div>
              <div>
                <Hidden smDown>
                  <LocationIcon className={classes.statusIcon} />
                </Hidden>
                <Typography
                  display="inline"
                  variant="body1"
                >
                  {meetupStatusLabels[user.meetupStatus]}
                </Typography>
              </div>
            </div>
          </UserSummary>
          <Hidden mdUp>
            <LinesEllipsis
              text={aboutText(user)}
              maxLine={4}
              component="p"
              className={classes.about}
            />
          </Hidden>
          <Hidden smDown>
            <Typography variant="body1" className={classes.about}>
              {aboutText(user)}
            </Typography>
            <LabelsAgeGenderLanguages user={user} />
            <LabelsReferencesLastActive user={user} />
          </Hidden>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
