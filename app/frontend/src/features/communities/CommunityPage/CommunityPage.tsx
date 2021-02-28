import { Breadcrumbs, makeStyles, Typography } from "@material-ui/core";
import React, { useEffect } from "react";
import { Link, useHistory, useParams } from "react-router-dom";

import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import {
  CalendarIcon,
  CouchIcon,
  EmailIcon,
  LocationIcon,
} from "../../../components/Icons";
import {
  routeToCommunity,
  routeToCommunityDiscussions,
  routeToCommunityEvents,
} from "../../../routes";
import { useCommunity } from "../useCommunity";
import CircularIconButton from "./CircularIconButton";
import DiscussionsSection from "./DiscussionsSection";
import EventsSection from "./EventsSection";
import HeaderImage from "./HeaderImage";
import PlacesSection from "./PlacesSection";

export const useCommunityPageStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(2),
  },
  center: {
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
  },
  header: {
    marginBottom: theme.spacing(1),
  },
  topContainer: {
    textAlign: "center",
    [theme.breakpoints.up("md")]: {
      display: "flex",
      justifyContent: "space-between",
      textAlign: "left",
    },
  },
  topInfo: {
    [theme.breakpoints.up("md")]: {
      width: "60%",
    },
  },
  breadcrumbs: {
    "& ol": {
      justifyContent: "center",
      [theme.breakpoints.up("md")]: {
        justifyContent: "flex-start",
      },
    },
  },
  title: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  description: {
    marginBottom: theme.spacing(1),
  },
  navButtonContainer: {
    display: "flex",
    justifyContent: "space-around",
    marginBottom: theme.spacing(1),
    [theme.breakpoints.only("sm")]: {
      justifyContent: "center",
      "& > * + *": {
        marginInlineStart: theme.spacing(4),
      },
    },
    [theme.breakpoints.up("md")]: {
      width: "30%",
    },
  },
  cardContainer: {
    [theme.breakpoints.down("xs")]: {
      //break out of page padding
      width: "100vw",
      position: "relative",
      left: "50%",
      right: "50%",
      marginLeft: "-50vw",
      marginRight: "-50vw",
    },
    [theme.breakpoints.up("sm")]: {
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(2),
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      "&::after": {
        content: "''",
        flexBasis: "100%",
        [theme.breakpoints.up("sm")]: {
          flexBasis: `calc(50% - ${theme.spacing(1)})`,
        },
        [theme.breakpoints.up("md")]: {
          flexBasis: `calc(33.33% - ${theme.spacing(1)})`,
        },
      },
    },
  },
  loadMoreButton: {
    alignSelf: "center",
    [theme.breakpoints.up("sm")]: {
      width: `calc(50% - ${theme.spacing(1)})`,
    },
    [theme.breakpoints.up("md")]: {
      width: `calc(33% - ${theme.spacing(1)})`,
    },
  },
  placeEventCard: {
    marginBottom: theme.spacing(1),
    width: 200,
    [theme.breakpoints.up("sm")]: {
      width: `calc(50% - ${theme.spacing(1)})`,
    },
    [theme.breakpoints.up("md")]: {
      width: `calc(33% - ${theme.spacing(1)})`,
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
    return <Alert severity="error">Invalid community id.</Alert>;

  if (isCommunityLoading)
    return <CircularProgress className={classes.center} />;

  if (!community || communityError)
    return (
      <Alert severity="error">
        {communityError?.message || "Error loading the community."}
      </Alert>
    );

  return (
    <div className={classes.root}>
      <HeaderImage community={community} className={classes.header} />
      <div className={classes.topContainer}>
        <div className={classes.topInfo}>
          <Breadcrumbs aria-label="breadcrumb" className={classes.breadcrumbs}>
            {community.parentsList
              .filter((parent) => !!parent.community)
              .map((parent) => (
                <Link
                  to={routeToCommunity(
                    parent.community!.communityId,
                    parent.community!.slug
                  )}
                  key={`breadcrumb-${parent.community?.communityId}`}
                >
                  {parent.community!.name}
                </Link>
              ))}
          </Breadcrumbs>
          <Typography variant="h1" className={classes.title}>
            Welcome to {community.name}!
          </Typography>
          <Typography variant="body2" className={classes.description}>
            {community.description} More tips and information
            <Link to="#"> here.</Link>
          </Typography>
        </div>
        <div className={classes.navButtonContainer}>
          <CircularIconButton id="findHostButton" label="Find host">
            <CouchIcon />
          </CircularIconButton>
          <CircularIconButton
            id="eventButton"
            label="Events"
            linkTo={routeToCommunityEvents(
              community.communityId,
              community.slug
            )}
          >
            <CalendarIcon />
          </CircularIconButton>
          <CircularIconButton id="localPointsButton" label="Local points">
            <LocationIcon />
          </CircularIconButton>
          <CircularIconButton
            id="discussButton"
            label="Discussions"
            linkTo={routeToCommunityDiscussions(
              community.communityId,
              community.slug
            )}
          >
            <EmailIcon />
          </CircularIconButton>
          <CircularIconButton id="hangoutsButton" label="Hangouts" disabled>
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
