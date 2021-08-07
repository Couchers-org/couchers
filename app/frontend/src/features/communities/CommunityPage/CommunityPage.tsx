import { Typography } from "@material-ui/core";
import { COMMUNITY_HEADING } from "features/communities/constants";
import { Redirect, Route, Switch } from "react-router-dom";
import { communityRoute, routeToCommunity } from "routes";
import makeStyles from "utils/makeStyles";

import CommunityBase from "../CommunityBase";
import CommunityInfoPage from "../CommunityInfoPage";
import { DiscussionsListPage, DiscussionsSection } from "../discussions";
import EventsList from "../events/EventsList";
import EventsSection from "../events/EventsSection";
import InfoPageSection from "./InfoPageSection";

export const useCommunityPageStyles = makeStyles((theme) => ({
  title: {
    marginTop: theme.spacing(3),
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
    width: "50%",
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
                  "discussions"
                )}
              >
                <DiscussionsListPage community={community} />
              </Route>
              <Route
                path={routeToCommunity(
                  community.communityId,
                  community.slug,
                  "events"
                )}
              >
                <EventsList community={community} />
              </Route>
              <Route path={communityRoute} exact>
                <InfoPageSection community={community} />
                <EventsSection community={community} />
                <DiscussionsSection community={community} />
              </Route>
            </Switch>
          </>
        );
      }}
    </CommunityBase>
  );
}
