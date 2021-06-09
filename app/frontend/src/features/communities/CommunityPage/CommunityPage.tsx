import { Typography } from "@material-ui/core";
import { COMMUNITY_HEADING } from "features/communities/constants";
import { Redirect, Route, Switch } from "react-router-dom";
import { communityRoute, routeToCommunity, searchRoute } from "routes";
import makeStyles from "utils/makeStyles";

import CommunityBase from "../CommunityBase";
import CommunityInfoPage from "../CommunityInfoPage";
import { DiscussionsListPage, DiscussionsSection } from "../discussions";
import InfoPageSection from "./InfoPageSection";

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
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(1),
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
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gridGap: theme.spacing(2),
    },
    [theme.breakpoints.up("md")]: {
      gridTemplateColumns: "repeat(3, 1fr)",
      gridGap: theme.spacing(3),
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
      width: "100%",
    },
    [theme.breakpoints.down("xs")]: {
      margin: theme.spacing(0, 2, 1, 0),
    },
    width: 192,
    flexShrink: 0,
    borderRadius: theme.shape.borderRadius * 2,
    scrollSnapAlign: "start",
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
                  {community.description}
                </Typography>
              </Route>
            </Switch>

            <Switch>
              <Route
                path={routeToCommunity(
                  community.communityId,
                  community.slug,
                  "info"
                )}
              >
                <CommunityInfoPage community={community} />
              </Route>
              <Route
                path={routeToCommunity(
                  community.communityId,
                  community.slug,
                  "find-host"
                )}
              >
                <Redirect
                  to={
                    //can't use a search filter directly until community filter is implemented
                    `${searchRoute}#loc/${
                      community.mainPage?.location?.lat ?? 0
                    }/${community.mainPage?.location?.lng ?? 0}`
                  }
                />
              </Route>
              <Route
                path={routeToCommunity(
                  community.communityId,
                  community.slug,
                  "events"
                )}
              >
                <Typography variant="body1">Events coming soon!</Typography>
              </Route>
              <Route
                path={routeToCommunity(
                  community.communityId,
                  community.slug,
                  "places"
                )}
              >
                <Typography variant="body1">Places coming soon</Typography>
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
                <Typography variant="body1">Hangouts coming soon!</Typography>
              </Route>
              <Route path={communityRoute} exact>
                <InfoPageSection community={community} />
                <DiscussionsSection community={community} />
              </Route>
            </Switch>
          </>
        );
      }}
    </CommunityBase>
  );
}
