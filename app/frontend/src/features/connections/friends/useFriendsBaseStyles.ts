import { makeStyles } from "@material-ui/core";

const useFriendsBaseStyles = makeStyles((theme) => ({
  circularProgress: {
    display: "block",
    margin: `0 auto ${theme.spacing(1)}`,
  },
  errorAlert: {
    borderRadius: 0,
  },
  header: {
    marginLeft: theme.spacing(1),
    marginBottom: theme.spacing(2),
    fontWeight: theme.typography.fontWeightBold,
  },
}));

export default useFriendsBaseStyles;
