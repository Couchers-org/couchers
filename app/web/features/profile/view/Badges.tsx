import { styled } from "@mui/material";
import Badge from "features/badges/Badge";
import { useBadges } from "features/badges/hooks";
import { User } from "proto/api_pb";

interface Props {
  user: User.AsObject;
}

const StyledContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
  // spacing comes from the gap, so the chips stay centred
  "& .MuiChip-root": { margin: 0 },
}));

export const Badges = ({ user }: Props) => {
  const { badges } = useBadges();

  if (badges === undefined || user.badgesList === undefined) {
    return <></>;
  }

  return (
    <StyledContainer>
      {(user.badgesList || []).map((badgeId) => {
        const badge = badges[badgeId];
        if (!badge) {
          return null;
        }
        return <Badge key={badge.id} badge={badge} />;
      })}
    </StyledContainer>
  );
};
