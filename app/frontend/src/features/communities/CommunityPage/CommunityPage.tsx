import { Breadcrumbs, Link as MuiLink, Typography } from "@material-ui/core";
import { TabContext } from "@material-ui/lab";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import TabBar from "components/TabBar";
import {
  COMMUNITY_HEADING,
  COMMUNITY_TABS_A11Y_LABEL,
  communityTabBarLabels,
  ERROR_LOADING_COMMUNITY,
  INVALID_COMMUNITY_ID,
  MORE_TIPS,
} from "features/communities/constants";
import { useCommunity } from "features/communities/hooks";
import { CommunityParent } from "pb/groups_pb";
import { useEffect } from "react";
import {
  Link,
  Redirect,
  Route,
  Switch,
  useHistory,
  useParams,
} from "react-router-dom";
import {
  communityRoute,
  CommunityTab,
  routeToCommunity,
  searchRoute,
} from "routes";
import makeStyles from "utils/makeStyles";

import { DiscussionsListPage, DiscussionsSection } from "../discussions";
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
  title: {
    marginBottom: 0,
    marginTop: 0,
    ...theme.typography.h1Large,
  },
  breadcrumbs: {
    "& ol": {
      justifyContent: "flex-start",
    },
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
  loadMoreButton: {
    alignSelf: "center",
    display: "flex",
    justifyContent: "center",
    width: "100%",
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

  const { page = "overview" } = useParams<{ page: string }>();
  const tab =
    page in communityTabBarLabels ? (page as CommunityTab) : "overview";

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
      <Breadcrumbs aria-label="breadcrumb" className={classes.breadcrumbs}>
        {community.parentsList
          .map((parent) => parent.community)
          .filter(
            (communityParent): communityParent is CommunityParent.AsObject =>
              !!communityParent
          )
          .map((communityParent) => (
            <MuiLink
              component={Link}
              to={routeToCommunity(
                communityParent.communityId,
                communityParent.slug
              )}
              key={`breadcrumb-${communityParent?.communityId}`}
            >
              {communityParent.name}
            </MuiLink>
          ))}
      </Breadcrumbs>
      <TabContext value={tab}>
        <TabBar
          ariaLabel={COMMUNITY_TABS_A11Y_LABEL}
          setValue={(newTab) =>
            history.push(
              `${routeToCommunity(
                community.communityId,
                community.slug,
                newTab === "overview" ? undefined : newTab
              )}`
            )
          }
          labels={communityTabBarLabels}
        />
      </TabContext>
      <Switch>
        <Route
          path={routeToCommunity(community.communityId, community.slug)}
          exact
        >
          <Typography variant="h1" className={classes.title}>
            {COMMUNITY_HEADING(community.name)}
          </Typography>
          <Typography variant="body2" className={classes.description}>
            {community.description}{" "}
            <MuiLink component={Link} to="#">
              {MORE_TIPS}
            </MuiLink>
          </Typography>
        </Route>
      </Switch>

      <Switch>
        <Route
          path={routeToCommunity(
            community.communityId,
            community.slug,
            "find-host"
          )}
        >
          <Redirect to={searchRoute} />
        </Route>
        <Route
          path={routeToCommunity(
            community.communityId,
            community.slug,
            "events"
          )}
        >
          <p>Replace this with full events page</p>
          <EventsSection community={community} />
        </Route>
        <Route
          path={routeToCommunity(
            community.communityId,
            community.slug,
            "local-points"
          )}
        >
          <p>Local points coming soon</p>
        </Route>
        <Route
          path={routeToCommunity(
            community.communityId,
            community.slug,
            "discussions"
          )}
        >
          <DiscussionsListPage community={community} />
        </Route>
        <Route
          path={routeToCommunity(
            community.communityId,
            community.slug,
            "hangouts"
          )}
        >
          <p>Hangouts coming soon!</p>
        </Route>
        <Route path={communityRoute} exact>
          <EventsSection community={community} />
          <PlacesSection community={community} />
          <DiscussionsSection community={community} />
        </Route>
      </Switch>
    </div>
  );
}
