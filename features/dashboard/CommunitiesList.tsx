import { Link as MuiLink, makeStyles, Typography } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import Alert from "components/Alert";
import Button from "components/Button";
import { useListSubCommunities } from "features/communities/hooks";
import {
  getMembers,
  LOAD_MORE,
  NO_COMMUNITY,
} from "features/dashboard/constants";
import useUserCommunities from "features/userQueries/useUserCommunities";
import Link from "next/link";
import React from "react";
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

export default function CommunitiesList({ all = false }: { all?: boolean }) {
  const classes = useStyles();
  const userCommunities = useUserCommunities();
  const allCommunities = useListSubCommunities(0);
  const communities = all ? allCommunities : userCommunities;
  return (
    <>
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
                  href={routeToCommunity(community.communityId, community.slug)}
                  key={`community-link-${community.communityId}`}
                >
                  <a className={classes.communityLink}>
                    <MuiLink variant="h2" component="span">
                      {community.name}
                    </MuiLink>
                    <Typography variant="body2">
                      {getMembers(community.memberCount)}
                    </Typography>
                  </a>
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
