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
  helpTextContainer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: theme.spacing(2),
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
  textField: {
    // so you can still see what you are typing when soft keyboard is up on
    // devices with not much vertical space, which causes overlap with footer
    background: theme.palette.common.white,
  },
}));

export default useSendFieldStyles;
