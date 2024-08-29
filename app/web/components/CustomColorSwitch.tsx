import { Switch, withStyles } from "@material-ui/core";

export default function CustomColorSwitch({
  checked,
  color,
  onClick,
}: {
  checked: boolean;
  color: string;
  onClick: () => void;
}) {
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
    },
    checked: {},
    track: {},
  }))(Switch);

  return <CustomColorSwitch checked={checked} onClick={onClick} />;
}
