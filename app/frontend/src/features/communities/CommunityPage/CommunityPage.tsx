import { Link as MuiLink, Typography } from "@material-ui/core";
import { COMMUNITY_HEADING, MORE_TIPS } from "features/communities/constants";
import { Link, Redirect, Route, Switch } from "react-router-dom";
import { communityRoute, routeToCommunity, searchRoute } from "routes";
import makeStyles from "utils/makeStyles";

import CommunityBase from "../CommunityBase";
import { DiscussionsListPage, DiscussionsSection } from "../discussions";
import EventsSection from "./EventsSection";
import PlacesSection from "./PlacesSection";

export const useCommunityPageStyles = makeStyles((theme) => ({
  title: {
    marginBottom: 0,
    marginTop: 0,
    ...theme.typography.h1Large,
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

  return (
    <CommunityBase>
      {({ community, communitySlug }) => {
        if (community && community.slug !== communitySlug) {
          return (
            <Redirect
              to={routeToCommunity(community.communityId, community.slug)}
            />
          );
        }
        return (
          <>
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
          </>
        );
      }}
    </CommunityBase>
  );
}
