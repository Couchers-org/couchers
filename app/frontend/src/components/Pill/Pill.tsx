import { Typography } from "@material-ui/core";
import classNames from "classnames";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.grey[200],
    padding: theme.spacing(0.5, 1),
    textAlign: "center",
    fontWeight: "bold",
  },
  rounded: {
    borderRadius: theme.shape.borderRadius * 6,
  },
}));

export interface PillProps {
  children: React.ReactNode;
  variant?: "rounded" | "square";
}

export default function Pill({ children, variant = "rounded" }: PillProps) {
  const classes = useStyles();

  return (
    <Typography
      className={classNames(classes.root, {
        [classes.rounded]: variant === "rounded",
      })}
      variant="body2"
    >
      {children}
    </Typography>
  );
}
