import { Switch, SwitchProps } from "@material-ui/core";
import classNames from "classnames";
import { useEffect, useState } from "react";
import { theme } from "theme";
import makeStyles from "utils/makeStyles";

import CircularProgress from "./CircularProgress";

interface SwitchStyleProps {
  checked: boolean;
  color: string;
  size: SwitchProps["size"];
}

const useStyles = makeStyles(({ palette, shadows }) => ({
  circle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: (props: SwitchStyleProps) => (props.size === "medium" ? 20 : 16),
    height: (props: SwitchStyleProps) => (props.size === "medium" ? 20 : 16),
    borderRadius: "50%",
    backgroundColor: palette.grey[600],
    boxShadow: shadows[1],
  },
  active: {
    backgroundColor: palette.grey[600],
  },
  switchBase: {
    color: palette.grey[600],
    "& + .MuiSwitch-track": {
      backgroundColor: palette.grey[200],
    },
    "&.Mui-checked": {
      color: (props: { color: string }) => props.color,
      "& + .MuiSwitch-track": {
        backgroundColor: (props: { color: string }) => props.color,
      },
    },
    "&.Mui-disabled": {
      color: (props: { checked: boolean; color: string }) =>
        props.checked ? props.color : palette.grey[600],
      "& + .MuiSwitch-track": {
        backgroundColor: (props: { checked: boolean; color: string }) =>
          props.checked ? props.color : palette.grey[200],
        opacity: 0.4,
      },
    },
  },
}));

export default function CustomColorSwitch({
  checked,
  onClick,
  size = "medium",
  status,
  isLoading = false,
  color = theme.palette.secondary.main,
}: {
  checked: boolean;
  onClick: SwitchProps["onClick"];
  size?: SwitchProps["size"];
  status?: string;
  isLoading?: boolean;
  color?: string;
}) {
  const classes = useStyles({ checked, color, size });

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const Icon = () => (
    <div
      className={classNames(classes.circle, {
        [classes.active]: checked && !isLoading,
      })}
      style={{ backgroundColor: checked ? color : undefined }}
    >
      {isLoading && (
        <CircularProgress
          size={size === "medium" ? 14 : 12}
          style={{ color: "white" }}
          thickness={6}
        />
      )}
    </div>
  );

  if (!isMounted) {
    return null;
  }

  return (
    <Switch
      classes={{
        switchBase: classes.switchBase,
      }}
      checked={checked}
      checkedIcon={<Icon />}
      disabled={isLoading || status === "loading"}
      icon={<Icon />}
      onClick={onClick}
      size={size}
    />
  );
}
