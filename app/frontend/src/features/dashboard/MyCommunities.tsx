import { Link as MuiLink, makeStyles, Typography } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import Alert from "components/Alert";
import Button from "components/Button";
import {
  COMMUNITIES_HEADING,
  getMembers,
  LOAD_MORE,
  NO_COMMUNITY,
} from "features/dashboard/constants";
import useUserCommunities from "features/userQueries/useUserCommunities";
import React from "react";
import { Link } from "react-router-dom";
import { routeToCommunity } from "routes";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";

const useStyles = makeStyles((theme) => ({
  communityLink: {
    display: "flex",
    alignItems: "baseline",
    margin: theme.spacing(1, 0),
    "& > *:first-child": {
      marginInlineEnd: theme.spacing(2),
    },
  },
}));

export default function MyCommunities() {
  const classes = useStyles();
  const communities = useUserCommunities();
  return (
    <>
      <Typography variant="h2">{COMMUNITIES_HEADING}</Typography>
      {communities.error?.message && (
        <Alert severity="error">{communities.error.message}</Alert>
      )}
      {communities.isLoading ? (
        <div className={classes.communityLink}>
          <MuiLink variant="h2" component="span">
            <Skeleton width={100} />
          </MuiLink>
          <Typography variant="body2">
            <Skeleton width={100} />
          </Typography>
        </div>
      ) : (
        communities.data &&
        (hasAtLeastOnePage(communities.data, "communitiesList") ? (
          <>
            {communities.data.pages
              .flatMap((page) => page.communitiesList)
              .map((community) => (
                <Link
                  to={routeToCommunity(community.communityId, community.slug)}
                  key={`community-link-${community.communityId}`}
                  className={classes.communityLink}
                >
                  <MuiLink variant="h2" component="span">
                    {community.name}
                  </MuiLink>
                  <Typography variant="body2">
                    {getMembers(community.memberCount)}
                  </Typography>
                </Link>
              ))}
            {communities.hasNextPage && (
              <Button
                onClick={() => communities.fetchNextPage()}
                loading={communities.isFetching}
              >
                {LOAD_MORE}
              </Button>
            )}
          </>
        ) : (
          <Typography variant="body1">{NO_COMMUNITY}</Typography>
        ))
      )}
    </>
  );
}
