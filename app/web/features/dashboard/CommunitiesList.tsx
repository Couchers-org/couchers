import { Skeleton, styled, Typography } from "@mui/material";
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

const GridContainer = styled("div")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "repeat(2, 1fr)",
  },
}));

const CommunityCard = styled(StyledLink)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(1.5),
  border: `1px solid var(--mui-palette-grey-300)`,
  borderRadius: theme.spacing(1),
  transition: "border-color 0.2s, box-shadow 0.2s",
  "&:hover": {
    borderColor: "var(--mui-palette-primary-main)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
}));

const SkeletonCard = styled("div")(({ theme }) => ({
  padding: theme.spacing(1.5),
  border: `1px solid var(--mui-palette-grey-300)`,
  borderRadius: theme.spacing(1),
}));

export default function CommunitiesList({ all = false }: { all?: boolean }) {
  const { t } = useTranslation([DASHBOARD]);
  const userCommunities = useUserCommunities({ pageSize: 6 });
  const allCommunities = useListSubCommunities(0);
  const communities = all ? allCommunities : userCommunities;

  return (
    <div>
      {communities.error?.message && (
        <Alert severity="error">{communities.error.message}</Alert>
      )}
      {communities.isLoading ? (
        <GridContainer>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i}>
              <Skeleton width="60%" height={24} />
              <Skeleton width="40%" height={20} />
            </SkeletonCard>
          ))}
        </GridContainer>
      ) : communities.data &&
        hasAtLeastOnePage(communities.data, "communitiesList") ? (
        <>
          <GridContainer>
            {communities.data.pages
              .flatMap((page) => page.communitiesList)
              .map((community) => (
                <CommunityCard
                  key={`community-${community.communityId}`}
                  href={routeToCommunity(community.communityId, community.slug)}
                >
                  <Typography
                    variant="subtitle2"
                    component="span"
                    fontWeight={600}
                  >
                    {community.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {t("dashboard:member_count", {
                      count: community.memberCount,
                    })}
                  </Typography>
                </CommunityCard>
              ))}
          </GridContainer>
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
      )}
    </div>
  );
}
