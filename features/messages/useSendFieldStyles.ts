import makeStyles from "utils/makeStyles";

const useSendFieldStyles = makeStyles((theme) => ({
  button: {
    display: "block",
    flexShrink: 0,
    marginInlineStart: theme.spacing(1),
    height: theme.spacing(5),
    marginBottom: 0,
    marginTop: "auto",
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
    marginTop: theme.spacing(3),
  },
  requestClosedLabel: {
    transform: "none",
  },
}));

export default useSendFieldStyles;
