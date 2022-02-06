import makeStyles from "@material-ui/core/styles/makeStyles";

const useMessageListStyles = makeStyles((theme) => ({
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
