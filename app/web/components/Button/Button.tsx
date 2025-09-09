import {
  ButtonProps,
  Button as MuiButton,
  styled,
  useTheme,
} from "@mui/material";
import React, { ForwardedRef, forwardRef } from "react";
import { isAsyncFunction } from "util/types";

import CircularProgress from "@/components/CircularProgress";
import { Sentry } from "@/platform/sentry";
import { theme } from "@/theme";
import { useIsMounted, useSafeState } from "@/utils/hooks";

const StyledMuiButton = styled(MuiButton, {
  shouldForwardProp: (prop) => prop !== "contained",
})<{ contained: boolean }>(({ contained }) => ({
  minHeight: `calc(calc(${theme.typography.button.lineHeight?.valueOf() ?? "1"} * ${
    theme.typography.button.fontSize?.valueOf() ?? "1rem"
  }) + ${theme.typography.pxToRem(12)})`, // from padding
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

type AsyncClickFunction = (
  ...params: Parameters<Required<ButtonProps>["onClick"]>
) => Promise<void>;

type InternalButtonProps = Omit<ButtonProps, "onClick"> & {
  onClick?: ButtonProps["onClick"] | AsyncClickFunction;
};

const InternalButton = (
  {
    children,
    disabled,
    className,
    loading,
    onClick,
    variant = "contained",
    color = "primary",
    ...otherProps
  }: InternalButtonProps,
  ref: ForwardedRef<HTMLButtonElement>,
) => {
  const isMounted = useIsMounted();
  const [isWaiting, setIsWaiting] = useSafeState(isMounted, false);
  const theme = useTheme();
  const asyncOnClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!onClick) {
      return;
    }

    if (!isAsyncFunction(onClick)) {
      return onClick(event);
    }

    try {
      setIsWaiting(true);
      await onClick(event);
    } catch (e) {
      Sentry.captureException(e);
    } finally {
      setIsWaiting(false);
    }
  };
  if (variant !== "contained" && color !== "primary") {
    throw new Error("Only contained buttons should have color.");
  }
  return (
    <StyledMuiButton
      {...otherProps}
      ref={ref}
      onClick={(e) => void asyncOnClick(e)}
      disabled={disabled ? true : loading || isWaiting}
      className={className}
      contained={variant === "contained"}
      variant={variant}
      color={variant === "contained" ? color : undefined}
    >
      {(loading || isWaiting) && (
        <StyledCircularProgress size={theme.typography.button.fontSize} />
      )}
      {children}
    </StyledMuiButton>
  );
};

const Button = forwardRef(InternalButton);
export default Button;
