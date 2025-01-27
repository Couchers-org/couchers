import {
  Button as MuiButton,
  ButtonProps,
  styled,
  useTheme,
} from "@mui/material";
import Sentry from "platform/sentry";
import React, { ElementType, ForwardedRef, forwardRef } from "react";
import { useIsMounted, useSafeState } from "utils/hooks";

import CircularProgress from "../CircularProgress";

const StyledMuiButton = styled(MuiButton, {
  shouldForwardProp: (prop) => prop !== "contained",
})<{ contained: boolean }>(({ theme, contained }) => ({
  minHeight: `calc(calc(${theme.typography.button.lineHeight} * ${
    theme.typography.button.fontSize
  }) + ${theme.typography.pxToRem(12)})`, //from padding
  ...(contained && {
    borderRadius: theme.shape.borderRadius,
    boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.25)",
  }),
}));

const StyledCircularProgress = styled(CircularProgress)(() => ({
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  top: 0,
  margin: "auto",
}));

function InternalButton<D extends ElementType = "button">(
  {
    children,
    disabled,
    className,
    loading,
    onClick,
    variant = "contained",
    color = "primary",
    ...otherProps
  }: ButtonProps<D>,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const isMounted = useIsMounted();
  const [waiting, setWaiting] = useSafeState(isMounted, false);
  const theme = useTheme();
  async function asyncOnClick(event: React.MouseEvent<HTMLButtonElement>) {
    try {
      setWaiting(true);

      if (onClick) {
        await onClick(event);
      }
    } catch (e) {
      Sentry.captureException(e);
    } finally {
      setWaiting(false);
    }
  }
  if (variant !== "contained" && color !== "primary") {
    throw new Error("Only contained buttons should have color.");
  }
  return (
    <StyledMuiButton
      {...otherProps}
      ref={ref}
      onClick={onClick && asyncOnClick}
      disabled={disabled ? true : loading || waiting}
      className={className}
      contained={variant === "contained"}
      variant={variant}
      color={variant === "contained" ? color : undefined}
    >
      {(loading || waiting) && (
        <StyledCircularProgress size={theme.typography.button.fontSize} />
      )}
      {children}
    </StyledMuiButton>
  );
}

const Button = forwardRef(InternalButton);
export default Button;
