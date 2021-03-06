import { Breadcrumbs, makeStyles, Typography } from "@material-ui/core";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import {
  CalendarIcon,
  CouchIcon,
  EmailIcon,
  LocationIcon,
} from "components/Icons";
import { useCommunity } from "features/communities/useCommunity";
import {
  COMMUNITY_HEADING,
  DISCUSSIONS_LABEL,
  ERROR_LOADING_COMMUNITY,
  EVENTS_LABEL,
  FIND_HOST,
  HANGOUTS_LABEL,
  INVALID_COMMUNITY_ID,
  LOCAL_POINTS_LABEL,
  MORE_TIPS,
} from "features/constants";
import { CommunityParent } from "pb/groups_pb";
import React, { useEffect } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import {
  routeToCommunity,
  routeToCommunityDiscussions,
  routeToCommunityEvents,
} from "routes";

import CircularIconButton from "./CircularIconButton";
import DiscussionsSection from "./DiscussionsSection";
import EventsSection from "./EventsSection";
import HeaderImage from "./HeaderImage";
import PlacesSection from "./PlacesSection";

export const useCommunityPageStyles = makeStyles((theme) => ({
  breadcrumbs: {
    "& ol": {
      [theme.breakpoints.up("md")]: {
        justifyContent: "flex-start",
      },
      justifyContent: "center",
    },
  },
  cardContainer: {
    [theme.breakpoints.down("xs")]: {
      //break out of page padding
      left: "50%",
      marginLeft: "-50vw",
      marginRight: "-50vw",
      position: "relative",
      right: "50%",
      width: "100vw",
    },
    [theme.breakpoints.up("sm")]: {
      "&::after": {
        [theme.breakpoints.up("sm")]: {
          flexBasis: `calc(50% - ${theme.spacing(1)})`,
        },
        [theme.breakpoints.up("md")]: {
          flexBasis: `calc(33.33% - ${theme.spacing(1)})`,
        },
        content: "''",
        flexBasis: "100%",
      },
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginBottom: theme.spacing(2),
      marginTop: theme.spacing(1),
    },
  },
  center: {
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
  },
  description: {
    marginBottom: theme.spacing(1),
  },
  header: {
    marginBottom: theme.spacing(1),
  },
  loadMoreButton: {
    [theme.breakpoints.up("sm")]: {
      width: `calc(50% - ${theme.spacing(1)})`,
    },
    [theme.breakpoints.up("md")]: {
      width: `calc(33% - ${theme.spacing(1)})`,
    },
    alignSelf: "center",
  },
  navButtonContainer: {
    [theme.breakpoints.only("sm")]: {
      "& > * + *": {
        marginInlineStart: theme.spacing(4),
      },
      justifyContent: "center",
    },
    [theme.breakpoints.up("md")]: {
      width: "30%",
    },
    display: "flex",
    justifyContent: "space-around",
    marginBottom: theme.spacing(1),
  },
  placeEventCard: {
    [theme.breakpoints.up("sm")]: {
      width: `calc(50% - ${theme.spacing(1)})`,
    },
    [theme.breakpoints.up("md")]: {
      width: `calc(33% - ${theme.spacing(1)})`,
    },
    marginBottom: theme.spacing(1),
    width: 200,
  },
  root: {
    marginBottom: theme.spacing(2),
  },
  title: {
    marginBottom: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
  topContainer: {
    [theme.breakpoints.up("md")]: {
      display: "flex",
      justifyContent: "space-between",
      textAlign: "left",
    },
    textAlign: "center",
  },
  topInfo: {
    [theme.breakpoints.up("md")]: {
      width: "60%",
    },
  },
}));

export default function CommunityPage() {
  const classes = useCommunityPageStyles();

  const { communityId, communitySlug } = useParams<{
    communityId: string;
    communitySlug?: string;
  }>();

  const {
    isLoading: isCommunityLoading,
    error: communityError,
    data: community,
  } = useCommunity(+communityId);

  const history = useHistory();
  useEffect(() => {
    if (!community) return;
    if (community.slug !== communitySlug) {
      // if the address is wrong, redirect to the right place
      history.replace(routeToCommunity(community.communityId, community.slug));
    }
  }, [community, communitySlug, history]);

  if (!communityId)
    return <Alert severity="error">{INVALID_COMMUNITY_ID}</Alert>;

  if (isCommunityLoading)
    return <CircularProgress className={classes.center} />;

  if (!community || communityError)
    return (
      <Alert severity="error">
        {communityError?.message || ERROR_LOADING_COMMUNITY}
      </Alert>
    );

  return (
    <div className={classes.root}>
      <HeaderImage community={community} className={classes.header} />
      <div className={classes.topContainer}>
        <div className={classes.topInfo}>
          <Breadcrumbs aria-label="breadcrumb" className={classes.breadcrumbs}>
            {community.parentsList
              .map((parent) => parent.community)
              .filter(
                (
                  communityParent
                ): communityParent is CommunityParent.AsObject =>
                  !!communityParent
              )
              .map((communityParent) => (
                <Link
                  to={routeToCommunity(
                    communityParent.communityId,
                    communityParent.slug
                  )}
                  key={`breadcrumb-${communityParent?.communityId}`}
                >
                  {communityParent.name}
                </Link>
              ))}
          </Breadcrumbs>
          <Typography variant="h1" className={classes.title}>
            {COMMUNITY_HEADING(community.name)}
          </Typography>
          <Typography variant="body2" className={classes.description}>
            {community.description} {MORE_TIPS}
            <Link to="#"> here.</Link>
          </Typography>
        </div>
        <div className={classes.navButtonContainer}>
          <CircularIconButton id="findHostButton" label={FIND_HOST}>
            <CouchIcon />
          </CircularIconButton>
          <CircularIconButton
            id="eventButton"
            label={EVENTS_LABEL}
            linkTo={routeToCommunityEvents(
              community.communityId,
              community.slug
            )}
          >
            <CalendarIcon />
          </CircularIconButton>
          <CircularIconButton id="localPointsButton" label={LOCAL_POINTS_LABEL}>
            <LocationIcon />
          </CircularIconButton>
          <CircularIconButton
            id="discussButton"
            label={DISCUSSIONS_LABEL}
            linkTo={routeToCommunityDiscussions(
              community.communityId,
              community.slug
            )}
          >
            <EmailIcon />
          </CircularIconButton>
          <CircularIconButton
            id="hangoutsButton"
            label={HANGOUTS_LABEL}
            disabled
          >
            <CouchIcon />
          </CircularIconButton>
        </div>
      </div>

      <PlacesSection community={community} />

      <EventsSection community={community} />

      <DiscussionsSection community={community} />
    </div>
  );
}
