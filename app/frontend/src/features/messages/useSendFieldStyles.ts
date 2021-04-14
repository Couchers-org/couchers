import makeStyles from "utils/makeStyles";

const useSendFieldStyles = makeStyles((theme) => ({
  button: {
    display: "block",
    flexShrink: 0,
    marginInlineStart: theme.spacing(1),
    marginBottom: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
  buttonContainer: {
    "& > button": {
      marginInline: theme.spacing(2),
    },
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  container: {
    alignItems: "flex-start",
    display: "flex",
  },
  requestClosedLabel: {
    transform: "none",
    padding: theme.spacing(2, 2),
  },
}));

export default useSendFieldStyles;
