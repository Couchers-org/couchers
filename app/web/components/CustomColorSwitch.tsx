import { styled, Switch, SwitchProps } from "@mui/material";
import { useEffect, useState } from "react";
import { theme } from "theme";

import CircularProgress from "./CircularProgress";

interface CustomSwitchProps extends Omit<SwitchProps, "color"> {
  checked: boolean;
  customColor?: string; // renamed to avoid conflict with existing color prop
  size?: SwitchProps["size"];
  status?: string;
  isLoading?: boolean;
}

const StyledCircle = styled("div", {
  shouldForwardProp: (prop) => prop !== "customColor" && prop !== "isLoading",
})<CustomSwitchProps>(({ theme, size, checked, customColor, isLoading }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: size === "medium" ? 20 : 16,
  height: size === "medium" ? 20 : 16,
  borderRadius: "50%",
  backgroundColor: checked ? customColor : theme.palette.grey[600],
  boxShadow: theme.shadows[1],
  ...(isLoading && {
    backgroundColor: theme.palette.grey[400], // Change color when loading
  }),
}));

const dontPassProps = ["customColor", "isLoading", "status"];

const StyledSwitch = styled(Switch, {
  shouldForwardProp: (prop) => !dontPassProps.includes(prop as string), // Filter out props that shouldn't be forwarded
})<CustomSwitchProps>(({ theme, customColor, checked, isLoading, status }) => ({
  "& .MuiSwitch-switchBase": {
    color: theme.palette.grey[600],
    "& + .MuiSwitch-track": {
      backgroundColor: theme.palette.grey[200],
    },
    "&.Mui-checked": {
      color: customColor,
      "& + .MuiSwitch-track": {
        backgroundColor: customColor,
      },
    },
    "&.Mui-disabled": {
      color: checked ? customColor : theme.palette.grey[600],
      "& + .MuiSwitch-track": {
        backgroundColor: checked ? customColor : theme.palette.grey[200],
        opacity: 0.4,
      },
    },
  },
  ...(isLoading || status === "loading"
    ? {
        opacity: 0.5, // Reduce opacity when loading or status is "loading"
        pointerEvents: "none", // Disable interaction when loading
      }
    : {}),
}));

export default function CustomColorSwitch({
  checked,
  onClick,
  size = "medium",
  status,
  isLoading = false,
  customColor = theme.palette.secondary.main, // renamed to customColor to avoid conflict with MUI Switch color
}: CustomSwitchProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const Icon = () => (
    <StyledCircle
      size={size}
      checked={checked}
      customColor={customColor}
      isLoading={isLoading}
    >
      {isLoading && (
        <CircularProgress
          size={size === "medium" ? 14 : 12}
          style={{ color: "white" }}
          thickness={6}
        />
      )}
    </StyledCircle>
  );

  if (!isMounted) {
    return null;
  }

  return (
    <StyledSwitch
      checked={checked}
      checkedIcon={<Icon />}
      disabled={isLoading || status === "loading"}
      icon={<Icon />}
      onClick={onClick}
      size={size}
      customColor={customColor} // Pass customColor prop to StyledSwitch
      isLoading={isLoading}
      status={status}
    />
  );
}
