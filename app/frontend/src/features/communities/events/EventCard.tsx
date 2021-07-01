import { Card, CardContent, CardMedia, Typography } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import classNames from "classnames";
import { useUser } from "features/userQueries/useUsers";
import { Event } from "proto/events_pb";
import { useMemo } from "react";
import LinesEllipsis from "react-lines-ellipsis";
import { Link } from "react-router-dom";
import dayjs from "utils/dayjs";
import makeStyles from "utils/makeStyles";

import { CalendarIcon, ClockIcon } from "../../../components/Icons";
import { routeToEvent } from "../../../routes";
import { timestamp2Date } from "../../../utils/date";
import { getAttendeesCount, getByCreator, ONLINE } from "../constants";
import getContentSummary from "../getContentSummary";
import eventImagePlaceholder from "./eventImagePlaceholder.svg";

const useStyles = makeStyles((theme) => ({
  root: {
    "&:hover": {
      backgroundColor: theme.palette.grey[50],
    },
  },
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
  detailsText: {
    ...theme.typography.body2,
    color: theme.palette.secondary.main,
    fontWeight: "bold",
  },
  otherInfoSection: {
    display: "grid",
    rowGap: theme.spacing(1),
    marginTop: theme.spacing(3),
  },
}));

export const EVENT_CARD_TEST_ID = "event-card";
export interface EventCardProps {
  event: Event.AsObject;
  className?: string;
}

export default function EventCard({ event, className }: EventCardProps) {
  const classes = useStyles();
  const { data: eventCreator } = useUser(event.creatorUserId);

  const startTime = timestamp2Date(event.startTime!);
  const endTime = timestamp2Date(event.endTime!);

  const truncatedContent = useMemo(
    () => getContentSummary(event.content),
    [event.content]
  );

  return (
    <Card
      className={classNames(className, classes.root)}
      data-testid={EVENT_CARD_TEST_ID}
    >
      <Link to={routeToEvent(event.eventId ?? 0, event.slug ?? "")}>
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
              <CalendarIcon className={classes.icon} />
              <Typography variant="body2" noWrap>
                {dayjs(startTime).format("LL")}
              </Typography>
            </li>
            <li>
              <ClockIcon className={classes.icon} />
              <Typography variant="body2" noWrap>
                {`${dayjs(startTime).format("LT")} - ${dayjs(endTime).format(
                  "LT"
                )}`}
              </Typography>
            </li>
            <li>
              <LinesEllipsis
                text={
                  event.offlineInformation
                    ? event.offlineInformation.address
                    : ONLINE
                }
                maxLine={2}
                component="span"
                className={classes.detailsText}
              />
            </li>
          </ul>
          <div className={classes.otherInfoSection}>
            <Typography variant="body2">
              {getAttendeesCount(event.goingCount)}
            </Typography>
            <Typography variant="body2">{truncatedContent}</Typography>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
