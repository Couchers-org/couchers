import { Link as MuiLink, Skeleton, Typography } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import Alert from "components/Alert";
import Button from "components/Button";
import StyledLink from "components/StyledLink";
import { useListSubCommunities } from "features/communities/hooks";
import useUserCommunities from "features/userQueries/useUserCommunities";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import React from "react";
import { routeToCommunity } from "routes";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";

const useStyles = makeStyles((theme) => ({
  communityLink: {
    display: "flex",
    flexDirection: "column",
    padding: theme.spacing(2, 0),
    borderBottom: `solid 1px ${theme.palette.divider}`,
    "&:first-child": {
      borderTop: `solid 1px ${theme.palette.divider}`,
    },
  },
}));

export default function CommunitiesList({ all = false }: { all?: boolean }) {
  const { t } = useTranslation([DASHBOARD]);
  const classes = useStyles();
  const userCommunities = useUserCommunities();
  const allCommunities = useListSubCommunities(0);
  const communities = all ? allCommunities : userCommunities;
  return (
    <div>
      {communities.error?.message && (
        <Alert severity="error">{communities.error.message}</Alert>
      )}
      {communities.isLoading ? (
        <div className={classes.communityLink}>
          <MuiLink variant="h2" component="span" underline="hover">
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
                <StyledLink
                  href={routeToCommunity(community.communityId, community.slug)}
                  key={`community-link-${community.communityId}`}
                  className={classes.communityLink}
                >
                  <Typography variant="h2" component="span">
                    {community.name}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    {t("dashboard:member_count", {
                      count: community.memberCount,
                    })}
                  </Typography>
                </StyledLink>
              ))}
            {communities.hasNextPage && (
              <Button
                onClick={() => communities.fetchNextPage()}
                loading={communities.isFetching}
              >
                {t("dashboard:load_more")}
              </Button>
            )}
          </>
        ) : (
          <Typography variant="body1" color="textSecondary">
            {t("dashboard:no_community")}
          </Typography>
        ))
      )}
    </div>
  );
}
