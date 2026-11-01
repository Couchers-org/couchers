import { styled, Typography, TypographyProps } from "@mui/material";
import React, { forwardRef } from "react";

type ClampedTypographyConfig = {
  /** The WebkitLineClamp to apply (can be overridden via CSS media queries). If undefined, clamping is disabled. */
  WebkitLineClamp?: number;
  /** Add an ellipsis when text is truncated. */
  ellipsis?: boolean;
};

export interface ClampedTypographyProps extends TypographyProps, ClampedTypographyConfig {}

/**
 * A customized {@link Typography} component using a standard CSS approach to truncating lines with an optional ellipsis attribute.
 */
const ClampedTypography = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "WebkitLineClamp" && prop !== "ellipsis",
})<ClampedTypographyProps>(({ WebkitLineClamp, ellipsis = false }) => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  overflowWrap: "break-word",
  whiteSpace: "normal",
  ...(WebkitLineClamp !== undefined && { WebkitLineClamp }),
  ...(ellipsis && { textOverflow: "ellipsis" }),
}));

/** A {@link ClampedTypography} factory to minimize code boilerplate */
export const clampedTypographyWith = (defaults: ClampedTypographyConfig) =>
  forwardRef<React.ComponentRef<typeof Typography>, ClampedTypographyProps>(function ClampedTypographyWith(props, ref) {
    return <ClampedTypography ref={ref} {...defaults} {...props} />;
  });

export default ClampedTypography;
