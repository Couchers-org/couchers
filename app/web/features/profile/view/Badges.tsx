import { User } from "@couchers/services/api";
import { styled } from "@mui/material";

import Badge from "@/features/badges/Badge";
import { useBadges } from "@/features/badges/hooks";

interface Props {
  user: User.AsObject;
}

const StyledContainer = styled("div")(({ theme }) => ({
  marginTop: theme.spacing(1),
}));

export const Badges = ({ user }: Props) => {
  const { badges } = useBadges();

  if (badges === undefined) {
    return <></>;
  }

  return (
    <StyledContainer>
      {user.badgesList.map((badgeId) => {
        const badge = badges[badgeId];
        return <Badge key={badge.id} badge={badge} />;
      })}
    </StyledContainer>
  );
};
