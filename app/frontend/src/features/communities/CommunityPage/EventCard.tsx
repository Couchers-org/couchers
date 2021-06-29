import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Typography,
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { useUser } from "features/userQueries/useUsers";
import { Event } from "proto/events_pb";
import LinesEllipsis from "react-lines-ellipsis";
import { Link } from "react-router-dom";
import makeStyles from "utils/makeStyles";

import { CalendarIcon, ClockIcon } from "../../../components/Icons";
import { routeToEvent } from "../../../routes";
import { timestamp2Date } from "../../../utils/date";
import { getByCreator } from "../constants";
import eventImagePlaceholder from "./eventImagePlaceholder.svg";

const useStyles = makeStyles((theme) => ({
  image: {
    backgroundColor: theme.palette.grey[200],
    height: 80,
    objectFit: "contain",
    [theme.breakpoints.up("sm")]: {
      height: 100,
    },
    [theme.breakpoints.up("md")]: {
      height: 120,
    },
  },
  title: {
    ...theme.typography.h3,
    height: `calc(2 * calc(${theme.typography.h3.lineHeight} * ${theme.typography.h3.fontSize}))`,
    marginBottom: 0,
    marginTop: 0,
  },
  subtitle: { marginBottom: theme.spacing(0.5) },
  icon: {
    display: "block",
    fontSize: "1rem",
    marginInlineEnd: theme.spacing(0.5),
  },
  detailsList: {
    "& > li": {
      alignItems: "center",
      display: "flex",
    },
    "ul&": {
      listStyle: "none",
      margin: 0,
      padding: 0,
    },
  },
  detailsText: theme.typography.body2,
}));

export interface EventCardProps {
  event: Event.AsObject;
  className?: string;
}

export default function EventCard({ event, className }: EventCardProps) {
  const classes = useStyles();
  const { data: eventCreator } = useUser(event.creatorUserId);

  const date = timestamp2Date(event.startTime!);

  return (
    <Card className={className}>
      <Link to={routeToEvent(event.eventId ?? 0, event.slug ?? "")}>
        <CardActionArea>
          <CardMedia
            src={event.photoUrl ? event.photoUrl : eventImagePlaceholder}
            className={classes.image}
            component="img"
          />
          <CardContent>
            {eventCreator ? (
              <Typography
                variant="caption"
                component="p"
                className={classes.subtitle}
                noWrap
              >
                {getByCreator(eventCreator.name)}
              </Typography>
            ) : (
              <Skeleton />
            )}
            <LinesEllipsis
              maxLine={2}
              text={event.title}
              component="h3"
              className={classes.title}
            />
            <ul className={classes.detailsList}>
              <li>
                <LinesEllipsis
                  text={event.offlineInformation?.address}
                  maxLine={2}
                  component="span"
                  className={classes.detailsText}
                />
              </li>
              <li>
                <CalendarIcon className={classes.icon} />
                <Typography variant="body2" noWrap>
                  {date.toLocaleDateString(navigator.language, {
                    day: "numeric",
                    month: "short",
                  })}
                </Typography>
              </li>
              <li>
                <ClockIcon className={classes.icon} />
                <Typography variant="body2" noWrap>
                  {date.toLocaleTimeString(navigator.language, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </Typography>
              </li>
            </ul>
          </CardContent>
        </CardActionArea>
      </Link>
    </Card>
  );
}
