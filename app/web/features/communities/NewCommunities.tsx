import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { Chip, Skeleton, styled, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import { useRouter } from "next/router";
import { ListRecentCommunitiesRes } from "proto/communities_pb";
import { routeToCommunity } from "routes";
import { listRecentCommunities } from "service/communities";

const NEW_COMMUNITIES_LIMIT = 5;

const Container = styled("div")(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const ChipsContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
}));

const StyledChip = styled(Chip)({
  fontSize: "0.875rem",
  fontWeight: 500,
  height: 36,
  "& .MuiChip-icon": {
    fontSize: "1rem",
  },
});

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

  const { data, isLoading } = useQuery<ListRecentCommunitiesRes.AsObject, RpcError>({
    queryKey: ["recentCommunities", NEW_COMMUNITIES_LIMIT],
    queryFn: () => listRecentCommunities(NEW_COMMUNITIES_LIMIT),
  });

  if (isLoading) {
    return (
      <Container>
        <Label>
          <AutoAwesomeIcon fontSize="small" />
          {t("dashboard:new_pill")}
        </Label>
        <ChipsContainer>
          {Array.from({ length: NEW_COMMUNITIES_LIMIT }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" width={100} height={36} sx={{ borderRadius: 2 }} />
          ))}
        </ChipsContainer>
      </Container>
    );
  }

  const communities = data?.communitiesList ?? [];
  if (communities.length === 0) {
    return null;
  }

  return (
    <Container>
      <Label>
        <AutoAwesomeIcon fontSize="small" />
        {t("dashboard:new_pill")}
      </Label>
      <ChipsContainer>
        {communities.map((community) => (
          <StyledChip
            key={community.communityId}
            label={community.name}
            clickable
            onClick={() => router.push(routeToCommunity(community.communityId, community.slug))}
            variant="outlined"
          />
        ))}
      </ChipsContainer>
    </Container>
  );
}
