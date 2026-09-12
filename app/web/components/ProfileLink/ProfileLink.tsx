import { styled, Tooltip } from "@mui/material";
import { ChevronRightIcon, OpenInNewIcon } from "components/Icons";
import StyledLink from "components/StyledLink";
import { useProfileSheet } from "features/profile/ProfileSheetContext";
import { useTranslation } from "i18n";
import { PROFILE } from "i18n/namespaces";
import { MouseEvent, ReactNode } from "react";
import { routeToUser } from "routes";
import { useIsNativeEmbed } from "utils/nativeLink";
import useIsScreenSizeOrSmaller from "utils/useIsScreenSizeOrSmaller";

interface ProfileLinkProps {
  userId?: number;
  username: string;
  children?: ReactNode;
  className?: string;
  openInNewTab?: boolean;
  showOpenIcon?: boolean;
  "aria-label"?: string;
  style?: React.CSSProperties;
}

const trailingIcon = {
  display: "block",
  flexShrink: 0,
  height: "1.25rem",
  width: "1.25rem",
};

const StyledChevronRightIcon = styled(ChevronRightIcon)(({ theme }) => ({
  ...trailingIcon,
  marginInlineStart: theme.spacing(0.5),
}));

const StyledOpenInNewIcon = styled(OpenInNewIcon)(({ theme }) => ({
  ...trailingIcon,
  marginInlineStart: theme.spacing(0.5),
  "&:hover": {
    color: "var(--mui-palette-primary-dark)",
  },
}));

export default function ProfileLink({
  userId,
  username,
  children,
  className,
  openInNewTab,
  showOpenIcon = false,
  style,
  "aria-label": ariaLabel,
}: ProfileLinkProps) {
  const isNativeEmbed = useIsNativeEmbed();
  const isMobile = useIsScreenSizeOrSmaller("mobile");
  const { openProfileSheet } = useProfileSheet();
  const { t } = useTranslation(PROFILE);
  const opensSheet = (isNativeEmbed || isMobile) && userId !== undefined;
  const opensNewTab = !opensSheet && !!openInNewTab;

  const handleClick = (e: MouseEvent) => {
    // Opening the profile always wins over whatever row or card this sits inside
    e.stopPropagation();
    if (!opensSheet) return;
    // Stays a real link when it opens the sheet, so it looks and behaves like one
    // (link styling, long press, ctrl/cmd-click) and falls back to the profile page.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    openProfileSheet(userId!);
  };

  // Only looked up when the icon shows, so pages without the PROFILE namespace
  // can still render a plain ProfileLink.
  const iconLabel = !showOpenIcon
    ? undefined
    : opensNewTab
      ? t("profile:open_profile_new_tab")
      : t("profile:open_profile_a11y");

  return (
    <StyledLink
      href={routeToUser(username)}
      className={className}
      style={style}
      aria-label={ariaLabel ?? (children ? undefined : iconLabel)}
      onClick={handleClick}
      target={opensNewTab ? "_blank" : undefined}
      rel={opensNewTab ? "noopener noreferrer" : undefined}
    >
      {children}
      {showOpenIcon &&
        // The sheet slides over the page rather than navigating away, so it gets
        // a "drill in" chevron instead of the new tab icon.
        (opensNewTab ? (
          <Tooltip title={iconLabel}>
            <StyledOpenInNewIcon />
          </Tooltip>
        ) : (
          <StyledChevronRightIcon />
        ))}
    </StyledLink>
  );
}
