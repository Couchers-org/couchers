import { Switch } from "@material-ui/core";
import makeStyles from "utils/makeStyles";
import classNames from "classnames";

import CircularProgress from "./CircularProgress";

const useStyles = makeStyles(({ palette, shadows }) => ({
  circle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 20,
    height: 20,
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
  color,
  isLoading,
  onClick,
  status,
}: {
  checked: boolean;
  color: string;
  isLoading: boolean;
  onClick: () => void;
  status: string;
}) {
  const classes = useStyles({ checked, color });

  const Icon = () => (
    <div
      className={classNames(classes.circle, {
        [classes.active]: checked && !isLoading,
      })}
      style={{ backgroundColor: checked ? color : undefined }}
    >
      {isLoading && (
        <CircularProgress size={14} style={{ color: "white" }} thickness={6} />
      )}
    </div>
  );

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
    />
  );
}
