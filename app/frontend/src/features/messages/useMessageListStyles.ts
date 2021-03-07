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
    //margin won't go on the right, so make the width longer
    width: `calc(100% + ${theme.spacing(4)})`,
  },
  listItem: {
    marginInline: `-${theme.spacing(2)}`,
    paddingInline: `${theme.spacing(2)}`,
  },
  root: {},
}));

export default useMessageListStyles;
