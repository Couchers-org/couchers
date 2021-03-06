import { Breadcrumbs, Hidden, makeStyles, Typography } from "@material-ui/core";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import { useCommunity } from "features/communities/useCommunity";
import {
  COMMUNITY_HEADING,
  ERROR_LOADING_COMMUNITY,
  INVALID_COMMUNITY_ID,
  MORE_TIPS,
} from "features/constants";
import { CommunityParent } from "pb/groups_pb";
import React, { useEffect } from "react";
import { Link, Route, Switch, useHistory, useParams } from "react-router-dom";
import {
  communityDiscussionsRoute,
  communityEventsRoute,
  communityInfoRoute,
  communityRoute,
  routeToCommunity,
} from "routes";

import DiscussionsSection from "./DiscussionsSection";
import EventsSection from "./EventsSection";
import HeaderImage from "./HeaderImage";
import NavDesktop from "./NavDesktop";
import NavMobile from "./NavMobile";
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
  body: {
    //sidebar on desktop
    [theme.breakpoints.up("md")]: {
      alignItems: "flex-start",
      display: "flex",
      justifyContent: "center",
    },
  },
  content: {
    [theme.breakpoints.up("md")]: {
      flexGrow: 1,
      marginInlineStart: theme.spacing(4),
    },
  },
  mobileCenter: {
    textAlign: "center",
    [theme.breakpoints.up("md")]: {
      textAlign: "left",
    },
  },
  breadcrumbs: {
    "& ol": {
      [theme.breakpoints.up("md")]: {
        justifyContent: "flex-start",
      },
    },
  },
  title: {
    marginBottom: theme.spacing(1),
    marginTop: theme.spacing(1),
    [theme.breakpoints.up("md")]: theme.typography.h1Large,
  },
  description: {
    marginBottom: theme.spacing(1),
  },
  cardContainer: {
    alignItems: "flex-start",
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
      <div className={classes.body}>
        <Hidden smDown>
          <NavDesktop community={community} />
        </Hidden>
        <div className={classes.content}>
          <div className={classes.mobileCenter}>
            <Breadcrumbs
              aria-label="breadcrumb"
              className={classes.breadcrumbs}
            >
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
            <Switch>
              <Route path={communityRoute} exact>
                <Typography variant="h1" className={classes.title}>
                  {COMMUNITY_HEADING(community.name)}
                </Typography>
                <Typography variant="body2" className={classes.description}>
                  {community.description} <Link to="#">{MORE_TIPS}</Link>
                </Typography>
              </Route>
            </Switch>
            <Hidden mdUp>
              <NavMobile community={community} />
            </Hidden>
          </div>

          <Switch>
            <Route path={communityInfoRoute}>Info</Route>
            <Route path={communityEventsRoute}>
              <p>Replace this with full events page</p>
              <EventsSection community={community} />
            </Route>
            <Route path={communityDiscussionsRoute}>
              <p>Replace this with full discussions page</p>
              <DiscussionsSection community={community} />
            </Route>
            <Route path={communityRoute} exact>
              <EventsSection community={community} />
              <PlacesSection community={community} />
              <DiscussionsSection community={community} />
            </Route>
          </Switch>
        </div>
      </div>
    </div>
  );
}
