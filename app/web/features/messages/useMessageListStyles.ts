import makeStyles from "@mui/styles/makeStyles";

const useMessageListStyles = makeStyles((theme) => ({
  list: {
    width: "100%",
  },
  listItem: {
    marginInline: `-${theme.spacing(2)}`,
    paddingInline: `${theme.spacing(2)}`,
  },
  root: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
  loadingBox: {
    display: "flex",
    justifyContent: "center",
    padding: theme.spacing(2),
    width: "100%",
  },
}));

export default useMessageListStyles;
