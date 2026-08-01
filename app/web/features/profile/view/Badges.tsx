import { styled } from "@mui/material";
import { User } from "couchers/proto/api_pb";
import Badge from "features/badges/Badge";
import { useBadges } from "features/badges/hooks";

interface Props {
  user: User.AsObject;
}

const StyledContainer = styled("div")(({ theme }) => ({
  marginTop: theme.spacing(1),
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
