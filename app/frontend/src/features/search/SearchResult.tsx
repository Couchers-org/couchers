import { Card, CardContent, Hidden, Typography } from "@material-ui/core";
import Button from "components/Button";
import { CouchIcon, LocationIcon } from "components/Icons";
import UserSummary from "components/UserSummary";
import {
  aboutText,
  hostingStatusLabels,
  meetupStatusLabels,
} from "features/profile/constants";
import { getShowUserOnMap } from "features/search/constants";
import {
  LabelsAgeGenderLanguages,
  LabelsReferencesLastActive,
} from "features/user/UserTextAndLabel";
import { User } from "pb/api_pb";
import LinesEllipsis from "react-lines-ellipsis";
import makeStyles from "utils/makeStyles";
import { firstName } from "utils/names";
import stripMarkdown from "utils/stripMarkdown";

const useStyles = makeStyles((theme) => ({
  link: {
    "&:hover": {
      textDecoration: "none",
    },
    "& h2:hover": {
      textDecoration: "underline",
    },
  },
  about: {
    marginTop: theme.spacing(2),
    marginBottom: 0,
    ...theme.typography.body1,
    [theme.breakpoints.down("sm")]: {
      marginTop: theme.spacing(1),
      maxHeight: "2.5rem",
      overflow: "hidden",
    },
  },
  statusLabelWrapper: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    color: theme.palette.text.primary,
    "& > div": {
      display: "flex",
    },
    [theme.breakpoints.down("md")]: {
      "& > div": {
        display: "grid",
        gridTemplateColumns: "1.25rem 1fr",
        gridGap: theme.spacing(1),
      },
    },
    "& p": {
      wordBreak: "break-all",
    },
    [theme.breakpoints.down("sm")]: {
      "& p": {
        width: "100%",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        overflow: "hidden",
      },
    },
    "&:hover": {
      textDecoration: "none",
    },
  },
  statusIcon: {
    marginInlineEnd: theme.spacing(0.5),
  },
  mapButton: {
    display: "block",
    margin: "0 auto",
    maxWidth: "100%",
    marginTop: theme.spacing(2),
    [theme.breakpoints.down("sm")]: {
      marginTop: "auto",
    },
    "& .MuiButton-label": {
      overflow: "hidden",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
    },
  },
}));

interface SearchResultProps {
  className?: string;
  id?: string;
  user: User.AsObject;
  onSelect: (user: User.AsObject) => void;
  highlight?: boolean;
}

export default function SearchResult({
  className,
  id,
  user,
  onSelect,
  highlight = false,
}: SearchResultProps) {
  const classes = useStyles();
  return (
    <Card id={id} className={className} elevation={highlight ? 4 : undefined}>
      <CardContent>
        <UserSummary user={user} titleIsLink nameOnly>
          <div className={classes.statusLabelWrapper}>
            <div>
              <CouchIcon className={classes.statusIcon} />
              <Typography display="inline" variant="body1" color="primary">
                {hostingStatusLabels[user.hostingStatus]}
              </Typography>
            </div>
            <div>
              <LocationIcon className={classes.statusIcon} />
              <Typography display="inline" variant="body1">
                {meetupStatusLabels[user.meetupStatus]}
              </Typography>
            </div>
          </div>
        </UserSummary>
        <Hidden mdUp>
          <LinesEllipsis
            text={stripMarkdown(aboutText(user))}
            maxLine={3}
            component="p"
            className={classes.about}
          />
        </Hidden>
        <Hidden smDown>
          <Typography variant="body1" className={classes.about}>
            {stripMarkdown(aboutText(user))}
          </Typography>
          <LabelsAgeGenderLanguages user={user} />
          <LabelsReferencesLastActive user={user} />
        </Hidden>
        <Button
          onClick={() => onSelect(user)}
          variant="outlined"
          className={classes.mapButton}
          size="small"
        >
          {getShowUserOnMap(firstName(user.name))}
        </Button>
      </CardContent>
    </Card>
  );
}
