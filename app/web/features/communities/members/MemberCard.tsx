import { LocationOn } from "@mui/icons-material";
import { Avatar, Card, Stack, styled, Typography } from "@mui/material";
import ProfileLink from "components/ProfileLink/ProfileLink";
import StrongVerificationBadge from "components/StrongVerificationBadge";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { LiteUser } from "proto/api_pb";

const AVATAR_SIZE_MOBILE = "4.5rem"; // 72px
const AVATAR_SIZE_DESKTOP = "7rem"; // 112px

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 3, // 12px
  boxShadow: "0 0 5px 1px rgba(0,0,0,.08)",
  backgroundColor: "var(--mui-palette-background-paper)",
  height: "100%",
}));

const StyledLink = styled(ProfileLink)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  minWidth: 0,
  width: "100%",
  height: "100%",
  padding: theme.spacing(3),
  color: "inherit",
  textDecoration: "none",
  boxSizing: "border-box",
}));

const StyledAvatar = styled(Avatar)(({ theme }) => [
  {
    flexShrink: 0,
    width: AVATAR_SIZE_MOBILE,
    height: AVATAR_SIZE_MOBILE,
    fontSize: "1.75rem",
    backgroundColor: "#c4c4c4",
    [theme.breakpoints.up("sm")]: {
      width: AVATAR_SIZE_DESKTOP,
      height: AVATAR_SIZE_DESKTOP,
      fontSize: "2.75rem",
    },
  },
  theme.applyStyles("dark", {
    backgroundColor: "#aaafb4",
  }),
]);

const StyledDetails = styled("div")({
  minWidth: 0,
  flex: 1,
});

export default function MemberCard({ user }: { user: LiteUser.AsObject }) {
  const { t } = useTranslation(COMMUNITIES);

  return (
    <StyledCard>
      <StyledLink
        userId={user.userId}
        username={user.username}
        aria-label={t("member_card.profile_link_a11y_label", {
          name: user.name,
        })}
      >
        <StyledAvatar
          src={user.avatarThumbnailUrl || undefined}
          alt={user.name}
        >
          {user.name.charAt(0)}
        </StyledAvatar>
        <StyledDetails>
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            sx={{ minWidth: 0 }}
          >
            <Typography
              component="p"
              noWrap
              sx={(theme) => ({
                minWidth: 0,
                fontWeight: 700,
                fontSize: { xs: "1.25rem", sm: "1.875rem" },
                color: "var(--mui-palette-text-primary)",
                ...theme.applyStyles("dark", {
                  color: "var(--mui-palette-primary-main)",
                }),
              })}
            >
              {user.name}
            </Typography>
            {user.hasStrongVerification && <StrongVerificationBadge />}
          </Stack>
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            sx={{ minWidth: 0, color: "var(--mui-palette-text-secondary)" }}
          >
            <LocationOn fontSize="small" sx={{ flexShrink: 0 }} />
            <Typography
              component="p"
              noWrap
              sx={{ minWidth: 0, fontSize: { xs: "0.875rem", sm: "1.25rem" } }}
            >
              {user.city}
            </Typography>
          </Stack>
        </StyledDetails>
      </StyledLink>
    </StyledCard>
  );
}
