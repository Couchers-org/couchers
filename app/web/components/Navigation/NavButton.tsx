import { styled, Typography, TypographyProps } from "@mui/material";
import NotificationBadge from "components/NotificationBadge";
import Link from "next/link";
import { useRouter } from "next/router";
import { baseRoute } from "routes";

interface NavButtonProps {
  route: string;
  label: string;
  labelVariant?: Exclude<TypographyProps["variant"], undefined>;
  notificationCount?: number;
}

const StyledNextLink = styled(Link, {
  shouldForwardProp: (prop) =>
    prop !== "isNotification" && prop !== "isSelected",
})<{
  isNotification: boolean;
  isSelected: boolean;
}>(({ theme, isNotification, isSelected }) => ({
  display: "flex",
  flex: "1",
  maxWidth: "10.5rem",
  padding: theme.spacing(1, 1.5),
  ...(isNotification && { marginRight: "0.8rem" }),
  ...(isSelected && { color: "var(--mui-palette-secondary-main)" }),
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  alignSelf: "center",
  marginTop: 0,
  fontWeight: 500,

  [theme.breakpoints.up("md")]: {
    fontSize: "1.2rem",
  },
}));

export default function NavButton({
  route,
  label,
  labelVariant = "h4",
  notificationCount,
}: NavButtonProps) {
  const router = useRouter();
  const isActive =
    route === baseRoute
      ? router.asPath === route
      : router.asPath.includes(route);

  return (
    <StyledNextLink
      href={route}
      isNotification={!!notificationCount}
      isSelected={isActive}
    >
      <NotificationBadge count={notificationCount}>
        <StyledTypography variant={labelVariant} noWrap>
          {label}
        </StyledTypography>
      </NotificationBadge>
    </StyledNextLink>
  );
}
