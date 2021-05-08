import makeStyles from "utils/makeStyles";

export default makeStyles((theme) => ({
  discussionsContainer: {
    "& > *": {
      width: "100%",
    },
    "& > :not(:last-child)": {
      marginBlockEnd: theme.spacing(3),
    },
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBlockEnd: theme.spacing(5),
  },
  discussionsHeader: {
    alignItems: "center",
    display: "flex",
  },
}));
