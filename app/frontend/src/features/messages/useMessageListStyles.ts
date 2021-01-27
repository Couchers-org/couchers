import makeStyles from "@material-ui/core/styles/makeStyles";

const useMessageListStyles = makeStyles((theme) => ({
  root: {},
  list: {
    //margin won't go on the right, so make the width longer
    width: `calc(100% + ${theme.spacing(4)})`,
  },
  link: {
    color: "inherit",
    textDecoration: "none",
    "&:hover": { textDecoration: "none" },
  },
  listItem: {
    marginInline: `-${theme.spacing(2)}`,
    paddingInline: `${theme.spacing(2)}`,
  },
}));

export default useMessageListStyles;
