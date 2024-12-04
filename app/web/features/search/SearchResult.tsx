import { Card, CardContent, Typography, useMediaQuery } from "@mui/material";
import classNames from "classnames";
import Button from "components/Button";
import { CouchIcon, LocationIcon } from "components/Icons";
import UserSummary from "components/UserSummary";
import {
  hostingStatusLabels,
  meetupStatusLabels,
} from "features/profile/constants";
import {
  AgeGenderLanguagesLabels,
  ReferencesLastActiveLabels,
} from "features/profile/view/userLabels";
import { aboutText } from "features/search/constants";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { User } from "proto/api_pb";
import LinesEllipsis from "react-lines-ellipsis";
import { theme } from "theme";
import makeStyles from "utils/makeStyles";
import { firstName } from "utils/names";
import stripMarkdown from "utils/stripMarkdown";

const useStyles = makeStyles((theme) => ({
  highlight: {
    borderColor: theme.palette.secondary.main,
    borderWidth: 2,
    borderStyle: "solid",
  },
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
    [theme.breakpoints.down("md")]: {
      marginTop: theme.spacing(1),
      maxHeight: `calc(3 * ${theme.typography.body1.lineHeight} * ${theme.typography.body1.fontSize})`,
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
    [theme.breakpoints.down("lg")]: {
      "& > div": {
        display: "grid",
        gridTemplateColumns: "1.25rem 1fr",
        gap: theme.spacing(1),
        alignItems: "center",
      },
    },
    "& p": {
      wordBreak: "break-all",
    },
    [theme.breakpoints.down("md")]: {
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
    [theme.breakpoints.down("md")]: {
      marginTop: "0.5rem",
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
  key: number;
}

export default function SearchResult({
  className,
  id,
  user,
  onSelect,
  highlight = false,
}: SearchResultProps) {
  const { t } = useTranslation([GLOBAL, SEARCH]);
  const classes = useStyles();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Card
      id={id}
      className={classNames(className, { [classes.highlight]: highlight })}
    >
      <CardContent>
        <UserSummary user={user} titleIsLink nameOnly>
          <div className={classes.statusLabelWrapper}>
            <div>
              <CouchIcon className={classes.statusIcon} />
              <Typography display="inline" variant="body1" color="primary">
                {hostingStatusLabels(t)[user.hostingStatus]}
              </Typography>
            </div>
            <div>
              <LocationIcon className={classes.statusIcon} />
              <Typography display="inline" variant="body1">
                {meetupStatusLabels(t)[user.meetupStatus]}
              </Typography>
            </div>
          </div>
          <Typography noWrap>{user.city}</Typography>
        </UserSummary>
        {isMobile && (
          <LinesEllipsis
            text={stripMarkdown(aboutText(user, t))}
            maxLine={3}
            component="p"
            className={classes.about}
          />
        )}
        {!isMobile && (
          <>
            <Typography variant="body1" className={classes.about}>
              {stripMarkdown(aboutText(user, t))}
            </Typography>
            <AgeGenderLanguagesLabels user={user} />
            <ReferencesLastActiveLabels user={user} />
          </>
        )}
        <Button
          onClick={() => onSelect(user)}
          variant="outlined"
          className={classes.mapButton}
          size="small"
          sx={{
            color: theme.palette.common.black,
            borderColor: theme.palette.grey[300],

            "&:hover": {
              borderColor: theme.palette.grey[300],
              backgroundColor: "#3135390A",
            },
          }}
        >
          {t("search:search_result.show_user_button_label", {
            name: firstName(user.name),
          })}
        </Button>
      </CardContent>
    </Card>
  );
}
