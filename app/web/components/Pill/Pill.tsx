import { Typography } from "@material-ui/core";
import classNames from "classnames";
import makeStyles from "utils/makeStyles";

interface PillStylesProps {
  backgroundColor?: string;
  color?: string;
}

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: (props: PillStylesProps) =>
      props.backgroundColor ?? theme.palette.grey[200],
    color: (props: PillStylesProps) =>
      props.color ?? theme.palette.text.primary,
    padding: theme.spacing(0.5, 1),
    textAlign: "center",
    fontWeight: "bold",
    margin: theme.spacing(0.5),
  },
  rounded: {
    borderRadius: theme.shape.borderRadius * 6,
  },
}));

export interface PillProps {
  children: React.ReactNode;
  backgroundColor?: string;
  color?: string;
  variant?: "rounded" | "square";
}

export default function Pill({
  children,
  backgroundColor,
  color,
  variant = "rounded",
}: PillProps) {
  const classes = useStyles({ backgroundColor, color });

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
