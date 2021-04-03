import makeStyles from "@material-ui/core/styles/makeStyles";

const useMessageListStyles = makeStyles((theme) => ({
  link: {
    "&:hover": {
      textDecoration: "none",
    },
    color: "inherit",
    textDecoration: "none",
  },
  list: {
    width: "100%",
  },
  listItem: {
    marginInline: `-${theme.spacing(2)}`,
    paddingInline: `${theme.spacing(2)}`,
  },
  root: {},
}));

export default useMessageListStyles;
