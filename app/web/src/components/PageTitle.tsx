import { Typography, TypographyProps } from "@material-ui/core";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    paddingBottom: theme.spacing(2),
    paddingTop: theme.spacing(2),
  },
}));

type PageTitleProps = TypographyProps & {
  className?: string;
};

export default function PageTitle({ className, ...props }: PageTitleProps) {
  const classes = useStyles();

  return (
    <Typography
      {...props}
      className={className}
      classes={{ h1: classes.root }}
      variant="h1"
    />
  );
}
