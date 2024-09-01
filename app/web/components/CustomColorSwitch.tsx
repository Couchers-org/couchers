import { Switch, withStyles } from "@material-ui/core";
import makeStyles from "utils/makeStyles";

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
  const classes = useStyles();

  const CustomColorSwitch = withStyles((theme) => ({
    switchBase: {
      color: theme.palette.grey[600],
      "& + $track": {
        backgroundColor: theme.palette.grey[200],
      },
      "&$checked": {
        color,
        "& + $track": {
          backgroundColor: color,
        },
      },
      "&$disabled": {
        color: checked ? color : theme.palette.grey[600],
        "& + $track": {
          backgroundColor: checked ? color : theme.palette.grey[200],
          opacity: 0.4,
        },
      },
    },
    checked: {},
    disabled: {},
    track: {},
  }))(Switch);

  const Icon = () => (
    <div
      className={`${classes.circle} ${
        checked && !isLoading ? classes.active : ""
      }`}
      style={{ backgroundColor: checked ? color : undefined }}
    >
      {isLoading && (
        <CircularProgress size={14} style={{ color: "white" }} thickness={6} />
      )}
    </div>
  );

  return (
    <CustomColorSwitch
      checked={checked}
      checkedIcon={<Icon />}
      disabled={isLoading || status === "loading"}
      icon={<Icon />}
      onClick={onClick}
    />
  );
}
