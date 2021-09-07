import { Typography, TypographyProps } from "@material-ui/core";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    paddingBottom: theme.spacing(2),
    paddingTop: theme.spacing(2),
  },
}));

export default function PageTitle(props: TypographyProps) {
  const classes = useStyles();

  return <Typography {...props} classes={{ h1: classes.root }} variant="h1" />;
}
