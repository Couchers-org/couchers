import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { Chip, Skeleton, styled, Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import { useRouter } from "next/router";
import Sentry from "platform/sentry";
import { Community } from "proto/communities_pb";
import { useEffect, useState } from "react";
import { routeToCommunity } from "routes";
import { listCommunities } from "service/communities";

const Container = styled("div")(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const ChipsContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  fontSize: "0.875rem",
  fontWeight: 500,
  height: 36,
  "& .MuiChip-icon": {
    fontSize: "1rem",
  },
}));

const Label = styled(Typography)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  fontWeight: 600,
  color: "var(--mui-palette-text-secondary)",
  fontSize: "0.875rem",
}));

export default function NewCommunities() {
  const { t } = useTranslation(DASHBOARD);
  const router = useRouter();
  const [newCommunities, setNewCommunities] = useState<Community.AsObject[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch all communities from all regions, then filter to cities and sort by date
    const fetchNewCities = async () => {
      try {
        setIsLoading(true);

        // First, fetch all top-level regions
        const regionsResponse = await listCommunities(0);
        const regions = regionsResponse.communitiesList || [];

        if (regions.length === 0) {
          setNewCommunities([]);
          return;
        }

        // Then fetch subcommunities (cities) for each region
        const citiesPromises = regions.map((region) =>
          listCommunities(region.communityId).catch((err) => {
            Sentry.captureException(err, {
              tags: {
                component: "NewCommunities",
                action: "listCommunities",
                regionId: region.communityId.toString(),
              },
            });
            return { communitiesList: [], nextPageToken: "" };
          }),
        );
        const citiesResponses = await Promise.all(citiesPromises);

        // Flatten all cities and deduplicate
        const allCities = citiesResponses.flatMap(
          (response) => response.communitiesList || [],
        );
        const citiesMap = new Map<number, Community.AsObject>();
        allCities.forEach((community) => {
          if (
            community &&
            community.communityId &&
            !citiesMap.has(community.communityId)
          ) {
            citiesMap.set(community.communityId, community);
          }
        });

        // Sort by creation date (newest first) and take top 5
        const newestCities = Array.from(citiesMap.values())
          .sort((a, b) => {
            const aTime = a.created?.seconds || 0;
            const bTime = b.created?.seconds || 0;
            return bTime - aTime;
          })
          .slice(0, 5);

        setNewCommunities(newestCities);
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            component: "NewCommunities",
            action: "fetchNewCities",
          },
        });
        setNewCommunities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNewCities();
  }, []);

  if (isLoading) {
    return (
      <Container>
        <Label>
          <AutoAwesomeIcon fontSize="small" />
          {t("dashboard:new_pill")}
        </Label>
        <ChipsContainer>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              width={100}
              height={36}
              sx={{ borderRadius: 2 }}
            />
          ))}
        </ChipsContainer>
      </Container>
    );
  }

  if (newCommunities.length === 0) {
    return null;
  }

  return (
    <Container>
      <Label>
        <AutoAwesomeIcon fontSize="small" />
        {t("dashboard:new_pill")}
      </Label>
      <ChipsContainer>
        {newCommunities.map((community) => (
          <StyledChip
            key={community.communityId}
            label={community.name}
            clickable
            onClick={() =>
              router.push(
                routeToCommunity(community.communityId, community.slug),
              )
            }
            variant="outlined"
          />
        ))}
      </ChipsContainer>
    </Container>
  );
}
