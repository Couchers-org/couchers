import { styled } from "@mui/material";
import Badge from "features/badges/Badge";
import { useBadges } from "features/badges/hooks";
import { User } from "proto/api_pb";

interface Props {
  user: User.AsObject;
}

const StyledContainer = styled("div")(({ theme }) => ({
  // chips flow like text so text-wrap can balance the rows (2 + 2, not 3 + 1); browsers without it wrap normally
  textAlign: "center",
  textWrap: "balance",
  marginTop: theme.spacing(0.5),
  marginBottom: theme.spacing(0.5),
  "& .MuiChip-root": { margin: theme.spacing(0.5) },
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
