import { ButtonBase } from "@mui/material";
import StyledLink from "components/StyledLink";
import { useProfileSheet } from "features/profile/ProfileSheetContext";
import { MouseEvent, ReactNode } from "react";
import { routeToUser } from "routes";
import { useIsNativeEmbed } from "utils/nativeLink";

interface ProfileLinkProps {
  userId?: number;
  username: string;
  children: ReactNode;
  className?: string;
  openInNewTab?: boolean;
  "aria-label"?: string;
  style?: React.CSSProperties;
}

export default function ProfileLink({
  userId,
  username,
  children,
  className,
  openInNewTab,
  style,
  "aria-label": ariaLabel,
}: ProfileLinkProps) {
  const isNativeEmbed = useIsNativeEmbed();
  const { openProfileSheet } = useProfileSheet();

  if (isNativeEmbed && userId !== undefined) {
    return (
      <ButtonBase
        component="span"
        className={className}
        style={style}
        aria-label={ariaLabel}
        onClick={(e: MouseEvent) => {
          e.stopPropagation();
          openProfileSheet(userId);
        }}
        sx={{ cursor: "pointer", position: "static" }}
      >
        {children}
      </ButtonBase>
    );
  }

  return (
    <StyledLink
      href={routeToUser(username)}
      className={className}
      style={style}
      aria-label={ariaLabel}
      target={openInNewTab ? "_blank" : undefined}
      rel={openInNewTab ? "noopener noreferrer" : undefined}
    >
      {children}
    </StyledLink>
  );
}
